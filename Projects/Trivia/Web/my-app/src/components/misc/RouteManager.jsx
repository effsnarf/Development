import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './RouteManager.css';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));


// State management for the route transitions
// Renders all route components
// Marks CSS classes for animation transitions when navigating between routes
const RouteManager = ({ routes }) => {

    const transitionDuration = 600;

    // #region Navigation Direction
    const getNavigationDirection = (oldPath, newPath) => {
        const oldIndex = routes.findIndex((route) => route.path === oldPath);
        const newIndex = routes.findIndex((route) => route.path === newPath);
        return oldIndex < newIndex ? 'forward' : 'backward';
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

    let isTransitioning = false;

    const onPathChange = async (oldPath, newPath) => {
        if (isTransitioning) return;
        isTransitioning = true;
        setNavigationDirection(getNavigationDirection(oldPath, newPath));
        setRouteState(oldPath, 'exiting');
        await wait(transitionDuration / 2);
        setRouteState(oldPath, 'hidden');
        setRouteState(newPath, 'entering');
        await wait(transitionDuration / 2);
        setRouteState(newPath, 'visible');
    }

    // When the location changes, update the routeStates
    useEffect(() => {
        const oldPath = getPathByState('visible');
        const newPath = location.pathname;
        if (oldPath === newPath) return;
        onPathChange(oldPath, newPath);
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
