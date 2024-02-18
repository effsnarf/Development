import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './RouteManager.css';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let isTransitioning = false;
let oldUrl = null;

// State management for the route transitions
// Renders all route components
// Marks CSS classes for animation transitions when navigating between routes
const RouteManager = ({ routes }) => {

    const transitionDuration = 600;

    // This is because we might navigate to /question/0 or /question/1, etc,
    // but the route path is /question/:index
    const findRouteIndex = (url) => {
      if (!url) return -1;
        // For the sake of simplicity, check the /[part]/ of the url
        return routes.findIndex((route) => route.path.split('/')[1] === url.split('/')[1]);
    }
    const findRoute = (url) => routes[findRouteIndex(url)];

    // #region Navigation Direction
    const getNavigationDirection = (oldPath, newPath) => {
      const getRouteIndex = (path) => (!path?.length) ? -1 : findRouteIndex(path);
      const oldIndex = getRouteIndex(oldPath);
      const newIndex = getRouteIndex(newPath);
      if (oldIndex !== newIndex) return oldIndex < newIndex ? 'forward' : 'backward';
      // In case of /question/0 and /question/1, we want to compare the string
      return oldPath < newPath ? 'forward' : 'backward';
    };
    // #endregion

    // #region Route State Management (visible, hidden, entering, exiting)
    const [routeStates, setRouteStates] = useState(
        routes.reduce((states, route) => ({ ...states, [route.path]: 'hidden' }), {})
    );
    // Helper functions to get and set the route states
    const getPathByState = (state) => {
        return Object.keys(routeStates).find((path) => routeStates[path] === state);
    };
    const setRouteState = (path, state) => {
        setRouteStates((states) => ({ ...states, [path]: state }));
    };
    // #endregion

    // Reactive navigationDirection variable to be used in the markup
    const [navigationDirection, setNavigationDirection] = useState(null);

    const location = useLocation();

    const onPathChange = async (oldUrl, newUrl) => {
        if (isTransitioning) return;
        isTransitioning = true;
        const oldPath = findRoute(oldUrl)?.path;
        const newPath = findRoute(newUrl).path;
        setNavigationDirection(getNavigationDirection(oldUrl, newUrl));
        setRouteState(oldPath, 'exiting');
        await wait(transitionDuration / 2);
        setRouteState(oldPath, 'hidden');
        setRouteState(newPath, 'entering');
        await wait(transitionDuration / 2);
        setRouteState(newPath, 'visible');
        oldUrl = newUrl;
        isTransitioning = false;
    }

    // When the location changes, update the routeStates
    useEffect(() => {
        const newUrl = location.pathname;
        onPathChange(oldUrl, newUrl);
        oldUrl = newUrl;
    }, [location]);

  
  return (
    <div className="routes-container">
      {routes.map(({ path, component: Component }) => (
        <div key={path} className={`route-page ${routeStates[path]} ${navigationDirection}`}>
          <Component />
        </div>
      ))}
    </div>
  );
};


  
export default RouteManager;
