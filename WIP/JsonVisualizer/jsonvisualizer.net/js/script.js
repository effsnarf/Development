

function compileHaml(s)
{
  s = haml.compileHamlToJsString(s);
  var func = eval(`var func = ${s}`);
  return func();
}

function startup()
{
  Vue.component("obj-node", {
    props: {
      obj: null,
      level: Number,
      _path: Array
    },
    data: function () {
      return {
        type: null,
        path: (this._path)
      }
    },
    watch: {
    },
    template: util.haml(`
%div{"v-if": "(level || 0) < 100"}
  %template{"v-if": "(obj == null)"}

  %template{"v-if": "(Array.isArray(obj))"}
    %table.array
      %tbody
        %tr.item{"v-for": "(value, index) in obj", "v-bind:class": "{ 'hidden': !$root.isPathSelected(path.concat(['[]'])), 'search-match': $root.isSearchMatch(value, $root.query) }"}
          %td.key.hidden {{index}}
          %td.value
            %obj-node{":obj":"value", ":level":"level+1", ":_path":"$root.addPath(path.concat(['[]']))"}
  %template{"v-else-if": "(typeof(obj) == 'object')"}
    %table.object
      %tbody
        %tr.item{"v-for": "(value, key) in obj", "v-bind:class": "{ 'hidden': !$root.isPathSelected(path.concat([key])), 'search-match': $root.isSearchMatch(value, $root.query) }"}
          %td.key {{key}}
          %td.value
            %obj-node{":obj":"value", ":level":"level+1", ":_path":"$root.addPath(path.concat([key]))"}
  %template.item{"v-else-if":"true", "v-bind:class": "{ 'hidden': !$root.isPathSelected(path.concat(['[]'])), 'search-match': $root.isSearchMatch(obj, $root.query) }"}
    {{JSON.stringify(obj)}}
`)
  });
  
  var vue = new Vue({
    el: ".vue-main",
    data: {
      exs: [],
      json: "",
      query: null,
      show1: true,
      show2: true,
      obj: null,
      paths: {
        all: [],
        selected: []
      }
    },
    watch: {
      json: function(value) {
        try
        {
          this.paths.all = [];
          this.paths.selected = [];
          this.exs = [];
          if (!value)
          {
            this.obj = {};
            return;
          }
          this.obj = eval(`(${value})`);
        }
        catch (ex)
        {
          this.exs = [];
          this.exs.push(ex);
        }
      }
    },
    methods: {
      isSearchMatch: function(obj, query) {
        if (!obj) return false;
        if (!query) return false;
        if (typeof(obj) == "object") return false;
        return JSON.stringify(obj).toLowerCase().includes(query.toLowerCase());
      },
      addPath: function(path, list = this.paths.all) {
        if (!list.some(a => a.join(".") == path.join(".")))
        {
          list.push(path);
          list.sort((a,b) => JSON.stringify(b).localeCompare(JSON.stringify(a)));
        }
        return path; 
      },
      removePath: function(path, list = this.paths.selected) {
        var index = list.findIndex(a => a.join(".") == path.join("."));
        if (index == -1) return;
        list.splice(index, 1);
      },
      checkPath: function(path) {
        this.paths.selected.push(path);
        this.onPathChecked(path);
      },
      onPathChecked: function(path) {
        if (this.isPathSelected(path))
        {
          // path checked - add parent paths
          while (path.length > 1)
          {
            this.addPath(path = path.slice(0, path.length - 1), this.paths.selected);
          }
        }
        else
        {
          // path unchecked - remove child paths
          this.paths.all
            .filter(a => a.join(".").startsWith(path.join(".")) && (a.join(".") != path.join(".")))
            .forEach(a => this.removePath(a));
        }
      },
      isPathSelected: function(path) {
        if (this.paths.selected.length == 0) return true;
        return this.paths.selected.some(a => a.join(".") == path.join("."));
      },
      tryTestData: function() {
        this.json = JSON.stringify(testData);
        window.setTimeout(() => {
          testFields.forEach(a => $(`label[title="${a.join(",")}"]`).click());
          this.query = "soc";
          window.scrollTo(0, 0);
        }, 100);
      }
    },
  });
  
  window.onerror = function (errorMsg, url, lineNumber) {
    vue.exs.push(errorMsg);
    return false;
  };

}


window.setTimeout(startup, 1);




var testData = [
{
    "_id" : 11247467,
    "InstanceID" : 11247467,
    "MgUserID" : 12136290,
    "UrlName" : "Privilege-Denying-Feminist",
    "DisplayName" : "Privilege Denying Feminist",
    "LanguageCode" : "en",
    "GeneratorID" : 1545,
    "ImageID" : 254750,
    "Text0" : "Men get all the advantages in Society",
    "Text1" : "Got two scholarships for being a woman",
    "UpVotesScore" : 300,
    "DownVotesScore" : -69,
    "TotalVotesScore" : 231,
    "IsApproved" : false,
    "Created" : ("2011-11-08T01:43:00.000Z"),
    "CreatedDate" : ("2011-11-08T00:00:00.000Z"),
    "IsBrandSafeText" : true,
    "IsBrandSafeImage" : true,
    "CommentsCount" : 0,
    "Username" : null,
    "IsWorkSafeImage" : true,
    "Watermark" : null,
    "GeneratorTypeID" : 0,
    "IsRead" : null,
    "CreatedUnix" : (1320694980),
    "HotnessRank" : 4151.05230909965,
    "PageViews" : (5),
    "ImgurUrl" : null,
    "LanguageCodeGeneratorID" : "en_1545",
    "Text" : "Men get all the advantages in Society Got two scholarships for being a woman",
    "HotScore" : 4150.9986564
}

,
{
    "_id" : 11270002,
    "InstanceID" : 11270002,
    "MgUserID" : 12223732,
    "UrlName" : "Racist-Dawg",
    "DisplayName" : "Racist Dawg",
    "LanguageCode" : "en",
    "GeneratorID" : 366,
    "ImageID" : 15379,
    "Text0" : "Why Beyonce sings \"to the left, to the left\"",
    "Text1" : "Cause niggers dont have rights",
    "UpVotesScore" : 293,
    "DownVotesScore" : -62,
    "TotalVotesScore" : 231,
    "IsApproved" : false,
    "Created" : ("2011-11-08T21:48:00.000Z"),
    "CreatedDate" : ("2011-11-08T00:00:00.000Z"),
    "IsBrandSafeText" : true,
    "IsBrandSafeImage" : true,
    "CommentsCount" : 0,
    "Username" : null,
    "IsWorkSafeImage" : true,
    "Watermark" : null,
    "GeneratorTypeID" : 0,
    "IsRead" : null,
    "CreatedUnix" : (1320767280),
    "HotnessRank" : 4152.07918124605,
    "PageViews" : (2),
    "ImgurUrl" : null,
    "LanguageCodeGeneratorID" : "en_366",
    "Text" : "Why Beyonce sings \"to the left, to the left\" Cause niggers dont have rights",
    "HotScore" : 4152.6053231
}

,
{
    "_id" : 11302516,
    "InstanceID" : 11302516,
    "MgUserID" : 3256968,
    "UrlName" : "Socially-Awkward-Penguin",
    "DisplayName" : "Socially Awkward Penguin",
    "LanguageCode" : "en",
    "GeneratorID" : 29,
    "ImageID" : 983,
    "Text0" : "everyone else is finished eating",
    "Text1" : "guess i'm done too",
    "UpVotesScore" : 238,
    "DownVotesScore" : -7,
    "TotalVotesScore" : 231,
    "IsApproved" : false,
    "Created" : ("2011-11-09T21:55:00.000Z"),
    "CreatedDate" : ("2011-11-09T00:00:00.000Z"),
    "IsBrandSafeText" : true,
    "IsBrandSafeImage" : true,
    "CommentsCount" : 0,
    "Username" : "505jamz",
    "IsWorkSafeImage" : true,
    "Watermark" : null,
    "GeneratorTypeID" : 0,
    "IsRead" : null,
    "CreatedUnix" : (1320854100),
    "HotnessRank" : 4154.04921802267,
    "PageViews" : null,
    "ImgurUrl" : null,
    "LanguageCodeGeneratorID" : "en_29",
    "Text" : "everyone else is finished eating guess i'm done too",
    "HotScore" : 4154.5346564
}

,
{
    "_id" : 11395796,
    "InstanceID" : 11395796,
    "MgUserID" : 11582223,
    "UrlName" : "Socially-Awkward-Penguin",
    "DisplayName" : "Socially Awkward Penguin",
    "LanguageCode" : "en",
    "GeneratorID" : 29,
    "ImageID" : 983,
    "Text0" : "Wait for car to pass before crossing street",
    "Text1" : "car stops and waits",
    "UpVotesScore" : 236,
    "DownVotesScore" : -5,
    "TotalVotesScore" : 231,
    "IsApproved" : false,
    "Created" : ("2011-11-13T12:56:00.000Z"),
    "CreatedDate" : ("2011-11-13T00:00:00.000Z"),
    "IsBrandSafeText" : true,
    "IsBrandSafeImage" : true,
    "CommentsCount" : 0,
    "Username" : null,
    "IsWorkSafeImage" : true,
    "Watermark" : null,
    "GeneratorTypeID" : 0,
    "IsRead" : null,
    "CreatedUnix" : (1321167360),
    "HotnessRank" : 4161.02036128265,
    "PageViews" : null,
    "ImgurUrl" : null,
    "LanguageCodeGeneratorID" : "en_29",
    "Text" : "Wait for car to pass before crossing street car stops and waits",
    "HotScore" : 4161.4959898
}

,
{
    "_id" : 11473257,
    "InstanceID" : 11473257,
    "MgUserID" : 8790963,
    "UrlName" : "Age-Of-Empires",
    "DisplayName" : "Age Of Empires",
    "LanguageCode" : "en",
    "GeneratorID" : 446,
    "ImageID" : 158277,
    "Text0" : "Finish all campaings",
    "Text1" : "learn more history than in school",
    "UpVotesScore" : 250,
    "DownVotesScore" : -19,
    "TotalVotesScore" : 231,
    "IsApproved" : false,
    "Created" : ("2011-11-16T10:35:00.000Z"),
    "CreatedDate" : ("2011-11-16T00:00:00.000Z"),
    "IsBrandSafeText" : true,
    "IsBrandSafeImage" : true,
    "CommentsCount" : 0,
    "Username" : null,
    "IsWorkSafeImage" : true,
    "Watermark" : null,
    "GeneratorTypeID" : 0,
    "IsRead" : null,
    "CreatedUnix" : (1321418100),
    "HotnessRank" : 4167.0989896394,
    "PageViews" : (3),
    "ImgurUrl" : null,
    "LanguageCodeGeneratorID" : "en_446",
    "Text" : "Finish all campaings learn more history than in school",
    "HotScore" : 4167.0679898
}

,
{
    "_id" : 11490385,
    "InstanceID" : 11490385,
    "MgUserID" : 6209236,
    "UrlName" : "Insanity-Wolf",
    "DisplayName" : "Insanity Wolf",
    "LanguageCode" : "en",
    "GeneratorID" : 45,
    "ImageID" : 20,
    "Text0" : "steal candy from a baby",
    "Text1" : "eat the baby",
    "UpVotesScore" : 282,
    "DownVotesScore" : -51,
    "TotalVotesScore" : 231,
    "IsApproved" : false,
    "Created" : ("2011-11-17T03:46:00.000Z"),
    "CreatedDate" : ("2011-11-17T00:00:00.000Z"),
    "IsBrandSafeText" : true,
    "IsBrandSafeImage" : true,
    "CommentsCount" : 0,
    "Username" : null,
    "IsWorkSafeImage" : true,
    "Watermark" : null,
    "GeneratorTypeID" : 0,
    "IsRead" : null,
    "CreatedUnix" : (1321479960),
    "HotnessRank" : 4168.1152775914,
    "PageViews" : null,
    "ImgurUrl" : null,
    "LanguageCodeGeneratorID" : "en_45",
    "Text" : "steal candy from a baby eat the baby",
    "HotScore" : 4168.4426564
}

,
{
    "_id" : 11519538,
    "InstanceID" : 11519538,
    "MgUserID" : 13182652,
    "UrlName" : "Insanity-Wolf",
    "DisplayName" : "Insanity Wolf",
    "LanguageCode" : "en",
    "GeneratorID" : 45,
    "ImageID" : 20,
    "Text0" : "Zombie apocalypse?",
    "Text1" : "bite zombies and turn them human",
    "UpVotesScore" : 296,
    "DownVotesScore" : -65,
    "TotalVotesScore" : 231,
    "IsApproved" : false,
    "Created" : ("2011-11-18T05:33:00.000Z"),
    "CreatedDate" : ("2011-11-18T00:00:00.000Z"),
    "IsBrandSafeText" : true,
    "IsBrandSafeImage" : true,
    "CommentsCount" : 0,
    "Username" : null,
    "IsWorkSafeImage" : true,
    "Watermark" : null,
    "GeneratorTypeID" : 0,
    "IsRead" : null,
    "CreatedUnix" : (1321572780),
    "HotnessRank" : 4170.10991586302,
    "PageViews" : (1),
    "ImgurUrl" : null,
    "LanguageCodeGeneratorID" : "en_45",
    "Text" : "Zombie apocalypse? bite zombies and turn them human",
    "HotScore" : 4170.5053231
}

,
{
    "_id" : 11541951,
    "InstanceID" : 11541951,
    "MgUserID" : 13308786,
    "UrlName" : "Chill-Out-Lemur",
    "DisplayName" : "Chill Out Lemur",
    "LanguageCode" : "en",
    "GeneratorID" : 562,
    "ImageID" : 1227,
    "Text0" : "Just..",
    "Text1" : "just don't.",
    "UpVotesScore" : 292,
    "DownVotesScore" : -61,
    "TotalVotesScore" : 231,
    "IsApproved" : false,
    "Created" : ("2011-11-19T22:17:00.000Z"),
    "CreatedDate" : ("2011-11-19T00:00:00.000Z"),
    "IsBrandSafeText" : true,
    "IsBrandSafeImage" : true,
    "CommentsCount" : 1,
    "Username" : null,
    "IsWorkSafeImage" : true,
    "Watermark" : null,
    "GeneratorTypeID" : 0,
    "IsRead" : null,
    "CreatedUnix" : (1321719420),
    "HotnessRank" : 4173.12580645814,
    "PageViews" : (21),
    "ImgurUrl" : null,
    "LanguageCodeGeneratorID" : "en_562",
    "Text" : "Just.. just don't.",
    "HotScore" : 4173.7639898
}

,
{
    "_id" : 11647397,
    "InstanceID" : 11647397,
    "MgUserID" : -1906574120,
    "UrlName" : "Skyrim-Stan",
    "DisplayName" : "skyrim stan",
    "LanguageCode" : "en",
    "GeneratorID" : 317125,
    "ImageID" : 1982050,
    "Text0" : "I think my education",
    "Text1" : "is getting in the way of skyrim",
    "UpVotesScore" : 275,
    "DownVotesScore" : -44,
    "TotalVotesScore" : 231,
    "IsApproved" : false,
    "Created" : ("2011-11-25T10:14:00.000Z"),
    "CreatedDate" : ("2011-11-25T00:00:00.000Z"),
    "IsBrandSafeText" : true,
    "IsBrandSafeImage" : true,
    "CommentsCount" : 0,
    "Username" : null,
    "IsWorkSafeImage" : true,
    "Watermark" : null,
    "GeneratorTypeID" : 0,
    "IsRead" : null,
    "CreatedUnix" : (1322194440),
    "HotnessRank" : 4184.21272015442,
    "PageViews" : (1),
    "ImgurUrl" : null,
    "LanguageCodeGeneratorID" : "en_317125",
    "Text" : "I think my education is getting in the way of skyrim",
    "HotScore" : 4184.3199898
}

,
{
    "_id" : 12235782,
    "InstanceID" : 12235782,
    "MgUserID" : 1429858371,
    "UrlName" : "Skyrim-Stan",
    "DisplayName" : "skyrim stan",
    "LanguageCode" : "en",
    "GeneratorID" : 317125,
    "ImageID" : 1982050,
    "Text0" : "Slay dragon",
    "Text1" : "run from bear",
    "UpVotesScore" : 282,
    "DownVotesScore" : -51,
    "TotalVotesScore" : 231,
    "IsApproved" : false,
    "Created" : ("2011-12-13T14:18:00.000Z"),
    "CreatedDate" : ("2011-12-13T00:00:00.000Z"),
    "IsBrandSafeText" : true,
    "IsBrandSafeImage" : true,
    "CommentsCount" : 0,
    "Username" : null,
    "IsWorkSafeImage" : true,
    "Watermark" : null,
    "GeneratorTypeID" : 0,
    "IsRead" : null,
    "CreatedUnix" : (1323764280),
    "HotnessRank" : 4219.19089171692,
    "PageViews" : null,
    "ImgurUrl" : null,
    "LanguageCodeGeneratorID" : "en_317125",
    "Text" : "Slay dragon run from bear",
    "HotScore" : 4219.2053231
}
];


var testFields = [
  ["[]", "Text"],
  ["[]", "DisplayName"]
];
