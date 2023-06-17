if (typeof fetch == `undefined`) {
  var fetch = require("node-fetch");
}

if (typeof window == `undefined`) {
  var window = {};
}

var mgApi = {
  _apiKey: null,
  _sessionKey: null,

  _onError: null,

  _imagesHost:
    window?.location?.host?.indexOf("localhost") == 0
      ? "http://localhost/MemeGenerator.Web.Images"
      : "https://memegenerator.net/img",

  defaultApiPageSize: 15,

  getImageUrl: function (imageID, width, height) {
    return this._getUrl("images", imageID, width, height);
  },

  getInstanceImageUrl: function (instanceID, width, height) {
    return this._getUrl("instances", instanceID, width, height);
  },

  getInstanceText: function (instance) {
    return instance ? (instance.text0 + " " + instance.text1).trim() : null;
  },

  msToJsDate: function (date, timeZoneOffset) {
    var dt = moment(date);

    dt.subtract(timeZoneOffset * 60, "minutes");
    dt.utcOffset(0);

    return dt.toDate();
  },

  _getUrl: function (type, id, width, height) {
    if (width) {
      if (height) {
        return (
          mgApi._imagesHost +
          "/" +
          type +
          "/" +
          width +
          "x" +
          height +
          "/" +
          id +
          ".jpg"
        );
      } // width but no height
      else {
        return (
          mgApi._imagesHost + "/" + type + "/" + width + "x/" + id + ".jpg"
        );
      }
    } else if (height) {
      // height but no width
      return mgApi._imagesHost + "/" + type + "/x" + height + "/" + id + ".jpg";
    } // no width and no height
    else {
      return mgApi._imagesHost + "/" + type + "/" + id + ".jpg";
    }
  },

  _callMethod: function (name, args) {
    return new Promise(async (resolve, reject) => {
      var args2 = args || {};

      if (mgApi._apiKey) {
        args2.apiKey = mgApi._apiKey;
      }

      if (mgApi._sessionKey) {
        args2.sessionKey = mgApi._sessionKey;
      }

      let url =
        (window?.location?.host == "memegenerator.net" ||
        window?.location?.host?.indexOf("localhost:18009") > -1
          ? "/Version1Api/" + name
          : "https://api.memegenerator.net/" + name) +
        ("?u=" + new Date().valueOf());

      let toQS = (value) => {
        if (value == null) return ``;
        return value;
      };

      let argsStr = Object.entries(args2)
        .map((e) => `${e[0]}=${toQS(e[1])}`)
        .join(`&`);

      url += `&${argsStr}`;

      const started = Date.now();

      let res = await (await fetch(url)).json();

      const elapsed = (Date.now() - started);

      if (window.api) api.analytics.create("api", "method", { name, args, dt: { started, elapsed } });

      if (res.success) resolve(res.result);
      else reject(res.errorMessage);

      // jQuery ajax
      if (false) {
        var ajaxCall = $.ajax({
          url: url,
          type: "GET",
          crossDomain: true,
          data: args2,
          success: function (e) {
            if (e.success) {
              resolve(e.result);
            } else {
              if (mgApi._onError) {
                mgApi._onError(e.errorMessage);
              } else {
                reject(e.errorMessage);
              }
            }
          },
          error: function (e) {
            try {
              // I don"t know why this successful call get to the error handler
              if (e.status == 200) {
                var response = JSON.parse(e.responseText);
                if (response.success) {
                  resolve(response.result);
                  return;
                }
              }

              if (e.responseText.indexOf("{") == 0) {
                var obj = JSON.parse(e.responseText);
                if (obj.errorMessage) {
                  reject(obj.errorMessage);
                }
                throw e.responseText;
              } else {
                var regex = new RegExp("<title>(.+?)</title>");
                var title = e.responseText.match(regex)[1];
                var msg = title || genericErrorMessage;
                if (mgApi._onError) {
                  mgApi._onError(msg);
                } else {
                  throw msg;
                }
              }
            } catch (ex) {
              if (mgApi._onError) {
                mgApi._onError(ex);
              } else {
                reject(ex);
              }
            }
          },
        });
      }
    });
  },

  Init: function (apiKey, sessionKey) {
    mgApi._apiKey = apiKey;
    mgApi._sessionKey = sessionKey;
  },

  SetApiKey: function (apiKey) {
    mgApi._apiKey = apiKey;
  },

  Login: function (username, password) {
    mgApi
      ._callMethod("MgUser_Login", {
        usernameOrEmail: username,
        password: password,
      })
      .done(function (result) {
        mgApi._sessionKey = result.loginSession.sessionKey;
      });
  },

  Comment_Create: function (entityName, entityID, parentCommentID, text) {
    return mgApi._callMethod("Comment_Create", {
      entityName: entityName,
      entityID: entityID,
      parentCommentID: parentCommentID,
      text: text,
    });
  },
  Comment_Delete: function (commentID) {
    return mgApi._callMethod("Comment_Delete", { commentID: commentID });
  },
  Comments_Select: function (entityName, entityID, parentCommentID) {
    return mgApi._callMethod("Comments_Select", {
      entityName: entityName,
      entityID: entityID,
      parentCommentID: parentCommentID,
    });
  },
  ContentFlag_Create: function (contentUrl, reason, email) {
    return mgApi._callMethod("ContentFlag_Create", {
      contentUrl: contentUrl,
      reason: reason,
      email: email,
    });
  },
  Generator_Create: function (image, displayName) {
    return mgApi._callMethod("Generator_Create", {
      image: image,
      displayName: displayName,
    });
  },
  Generator_Select_ByUrlNameOrGeneratorID: function (generatorID, urlName) {
    return mgApi._callMethod("Generator_Select_ByUrlNameOrGeneratorID", {
      generatorID: generatorID,
      urlName: urlName,
    });
  },
  Generators_Search: function (q, pageIndex, pageSize) {
    return mgApi._callMethod("Generators_Search", {
      q: q,
      pageIndex: pageIndex,
      pageSize: pageSize,
    });
  },
  Generators_Select_ByMgUser: function (byMgUserID, pageIndex, pageSize) {
    return mgApi._callMethod("Generators_Select_ByMgUser", {
      byMgUserID: byMgUserID,
      pageIndex: pageIndex,
      pageSize: pageSize,
    });
  },
  Generators_Select_ByNew: function (pageIndex, pageSize) {
    return mgApi._callMethod("Generators_Select_ByNew", {
      pageIndex: pageIndex,
      pageSize: pageSize,
    });
  },
  Generators_Select_ByPopular: function (pageIndex, pageSize, days) {
    return mgApi._callMethod("Generators_Select_ByPopular", {
      pageIndex: pageIndex,
      pageSize: pageSize,
      days: days,
    });
  },
  Generators_Select_ByRecentlyCaptioned: function () {
    return mgApi._callMethod("Generators_Select_ByRecentlyCaptioned", {});
  },
  Generators_Select_BySubscriber: function (subscriberMgUserID) {
    return mgApi._callMethod("Generators_Select_BySubscriber", {
      subscriberMgUserID: subscriberMgUserID,
    });
  },
  Generators_Select_ByTrending: function () {
    return mgApi._callMethod("Generators_Select_ByTrending", {});
  },
  Generators_Select_ByUpvoted: function (byMgUserID, pageIndex, pageSize) {
    return mgApi._callMethod("Generators_Select_ByUpvoted", {
      byMgUserID: byMgUserID,
      pageIndex: pageIndex,
      pageSize: pageSize,
    });
  },
  Generators_Select_Related_ByDisplayName: function (displayName) {
    return mgApi._callMethod("Generators_Select_Related_ByDisplayName", {
      displayName: displayName,
    });
  },
  Instance_Create: function (
    languageCode,
    generatorID,
    groupID,
    imageID,
    text0,
    text1,
    tags
  ) {
    return mgApi._callMethod("Instance_Create", {
      languageCode: languageCode,
      generatorID: generatorID,
      groupID: groupID,
      imageID: imageID,
      text0: text0,
      text1: text1,
      tags: tags,
    });
  },
  Instance_Delete: function (instanceID) {
    return mgApi._callMethod("Instance_Delete", { instanceID: instanceID });
  },
  Instance_Select: function (instanceID) {
    return mgApi._callMethod("Instance_Select", { instanceID: instanceID });
  },
  Instances_Search: function (q, pageIndex, pageSize) {
    return mgApi._callMethod("Instances_Search", {
      q: q,
      pageIndex: pageIndex,
      pageSize: pageSize,
    });
  },
  Instances_Select_By_SubscriberMgUserID: function (
    sessionKey,
    languageCode,
    fromInstanceID,
    pageSize
  ) {
    return mgApi._callMethod("Instances_Select_By_SubscriberMgUserID", {
      sessionKey: sessionKey,
      languageCode: languageCode,
      fromInstanceID: fromInstanceID,
      pageSize: pageSize,
    });
  },
  Instances_Select_ByMgUser: function (byMgUserID, pageIndex, pageSize) {
    return mgApi._callMethod("Instances_Select_ByMgUser", {
      byMgUserID: byMgUserID,
      pageIndex: pageIndex,
      pageSize: pageSize,
    });
  },
  Instances_Select_ByNew: function (languageCode, pageIndex, urlName) {
    return mgApi._callMethod("Instances_Select_ByNew", {
      languageCode: languageCode,
      pageIndex: pageIndex,
      urlName: urlName,
    });
  },
  Instances_Select_ByPopular: function (
    languageCode,
    pageIndex,
    urlName,
    tag,
    days
  ) {
    return mgApi._callMethod("Instances_Select_ByPopular", {
      languageCode: languageCode,
      pageIndex: pageIndex,
      urlName: urlName,
      tag: tag,
      days: days,
    });
  },
  Instances_Select_ByUpvoted: function (byMgUserID, pageIndex, pageSize) {
    return mgApi._callMethod("Instances_Select_ByUpvoted", {
      byMgUserID: byMgUserID,
      pageIndex: pageIndex,
      pageSize: pageSize,
    });
  },
  MgImage_Select: function (mgImageID) {
    return mgApi._callMethod("MgImage_Select", { mgImageID: mgImageID });
  },
  MgImages_Search: function (q) {
    return mgApi._callMethod("MgImages_Search", { q: q });
  },
  MgUser_Login: function (username, password) {
    return mgApi._callMethod("MgUser_Login", {
      username: username,
      password: password,
    });
  },
  MgUser_Login_Facebook: function (facebookAccessToken) {
    return mgApi._callMethod("MgUser_Login_Facebook", {
      facebookAccessToken: facebookAccessToken,
    });
  },
  MgUser_SignUp: function (email, username, password) {
    return mgApi._callMethod("MgUser_SignUp", {
      email: email,
      username: username,
      password: password,
    });
  },
  MgUser_Update_Image: function (sessionKey, image) {
    return mgApi._callMethod("MgUser_Update_Image", {
      sessionKey: sessionKey,
      image: image,
    });
  },
  MgUser_Update_Username: function (sessionKey, newUsername) {
    return mgApi._callMethod("MgUser_Update_Username", {
      sessionKey: sessionKey,
      newUsername: newUsername,
    });
  },
  MgUsers_Select_ByPublisher: function (publisherMgUserID) {
    return mgApi._callMethod("MgUsers_Select_ByPublisher", {
      publisherMgUserID: publisherMgUserID,
    });
  },
  MgUsers_Select_BySubscriber: function (subscriberMgUserID) {
    return mgApi._callMethod("MgUsers_Select_BySubscriber", {
      subscriberMgUserID: subscriberMgUserID,
    });
  },
  Templates_Select_ByUrlName: function (urlName) {
    return mgApi._callMethod("Templates_Select_ByUrlName", {
      urlName: urlName,
    });
  },
  Vote: function (entityName, entityID, voteScore) {
    return mgApi._callMethod("Vote", {
      entityName: entityName,
      entityID: entityID,
      voteScore: voteScore,
    });
  },
};

(function (window) {
  // CommonJS
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = mgApi;
    // AMD
  } else if (typeof define === "function" && define.amd) {
    define([], function () {
      return mgApi;
    });
    // window
  } else if (!window.mgApi) {
    window.mgApi = mgApi;
  }
})(typeof window !== "undefined" ? window : this);

export default ({ app }, inject) => {
  // Inject in Vue, context and store.
  inject("mgApi", mgApi);
};
