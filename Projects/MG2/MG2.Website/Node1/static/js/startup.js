

const when = async (condition, callback) => {
  if (await condition()) {
    callback();
  } else {
    setTimeout(() => when(condition, callback), 100);
  }
}

const repeat = async (callback, interval) => {
  if (!interval) throw new Error("interval is required");
  await callback();
  setTimeout(() => repeat(callback, interval), interval);
}

function detectPageVisibility(callback) {
  // Detect Page Visibility API support
  const hiddenProperty = 'hidden' in document ? 'hidden' :
                         'webkitHidden' in document ? 'webkitHidden' :
                         'mozHidden' in document ? 'mozHidden' :
                         null;
  
  if (hiddenProperty !== null) {
    // Add event listener for visibility change
    document.addEventListener(hiddenProperty.replace(/hidden/i, 'visibilitychange'), function() {
      callback(!document[hiddenProperty]);
    });
    // Set initial state
    callback(!document[hiddenProperty]);
  }
}

function trackActiveTime(callback) {
  let isActive = true;
  let activeTime = 0;
  let timerId = null;
  
  // Detect page visibility state
  detectPageVisibility(function(isVisible) {
    isActive = isVisible;
    if (isActive) {
      // Start tracking active time
      timerId = setInterval(updateActiveTime, 100);
    } else {
      // Stop tracking active time
      clearInterval(timerId);
    }
  });
  
  // Update the active time every 100ms
  function updateActiveTime() {
    activeTime += 100;
    callback(activeTime);
  }
}


const initApi = (async() => {

  const capturedUiEvents = ["click", "wheel", "keypress"];

  const apify = (await Apify.Client.createClasses("/api"));
  const analytics = (await apify.Analytics.new());

  if (window.location.pathname.startsWith("/admin")) {
    window.api = { analytics };
  }
  else
  {
    const user = {
      ip: (await (await fetch("/api/ip")).text())
    };

    // Create a new visit
    const visit = null;
    // const visit = (await analytics.create(null, "MG.Web", "user", "visit", {
    //   user: user,
    //   ui: {
    //     e: Object.fromEntries(capturedUiEvents.map((e) => [e, 0])),
    //     total: 0
    //   },
    //   dt: {
    //     start: Date.now(),
    //     end: Date.now(),
    //     length: 0,
    //     active: 0
    //   }
    // }));

    if (visit)
    {
      // Track UI events
      capturedUiEvents.forEach((eventType) => {
        window.addEventListener(eventType, (e) => {
          visit.v.ui.e[e.type] = (visit.v.ui.e[e.type] || 0) + 1;
          visit.v.ui.total = Object.values(visit.v.ui.e).reduce((a, b) => a + b, 0);
        });
      });

      // Track time spent on page
      repeat(() => {
        visit.v.dt.end = Date.now();
        visit.v.dt.length = (visit.v.dt.end - visit.v.dt.start);
      }, 100);

      // Track active time on page
      trackActiveTime((activeTime) => {
        visit.v.dt.active = activeTime;
      });

      repeat(async () => {
        //await analytics.update(visit._id, visit.v);
      }, 1000);
    }

    const api = {
      user,
      visit,
      analytics
    };

    window.api = api;
  }


});



//when(() => (window.Apify.Client), initApi);


window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());


