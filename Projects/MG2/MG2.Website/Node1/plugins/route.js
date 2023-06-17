export default ({ app }) => {
  app.router.beforeEach((to, from, next) => {
    if (typeof(window) == `undefined`)
    {
      next();
      return;
    }

    if ((window.pageAlreadyLoaded) && (to.path == window.location.pathname))
    {
      setTimeout(() => {
        window.mgPopNav(to.path);
      }, 0);
      return false;
    }
    else
    {
      window.pageAlreadyLoaded = true;
      next();
    }
  });
}
