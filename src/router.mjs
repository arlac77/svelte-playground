import { compile, matcher } from "multi-path-matcher";

export class Router {
  constructor(routes = [], prefix = "") {
    let current;

    let compiledRoutes = compile(routes);

    Object.defineProperties(this, {
      prefix: { value: prefix },
      subscriptions: { value: [] },
      compiledRoutes: {
        get() {
          return compiledRoutes;
        }
      },
      routes: {
        get() {
          return routes;
        },
        set(value) {
          routes = value;
          compiledRoutes = compile(routes);
        }
      },
      current: {
        get() {
          return current;
        },
        set(value) {
          current = value;
          this.subscriptions.forEach(subscription => subscription(this));
        }
      }
    });

    window.addEventListener("routerLink", event => {
      let path = event.detail.path;

      if (path.startsWith(this.prefix)) {
        history.pushState(event.detail, "", path);
        path = path.substring(this.prefix.length);
      } else {
        event.detail.path = this.prefix + path;
        history.pushState(event.detail, "", this.prefix + path);
      }

      this.push(path);
    });

    window.addEventListener("popstate", event => {
      console.log("POPSTATE", event);
      if (event.state) {
        let path = event.state.path;
        if (path.startsWith(this.prefix)) {
          path = path.substring(this.prefix.length);
        }

        const { route, params } = matcher(this.routes, path);
        console.log("SET", path, route, params);
        this.current = route;
      }
    });

    setTimeout(() => this.initializeCurrent(), 10);
  }

  initializeCurrent() {
    const path = window.location.pathname + window.location.search;
    console.log("INIT", path);

    this.push(path);
  }

  get currentComponent() {
    const r = this.current;
    return r !== undefined && r.component;
  }

  push(path) {
    const { route, params } = matcher(this.compiledRoutes, path);

    console.log("PUSH", path, route, params);

    this.current = route;
  }

  subscribe(cb) {
    this.subscriptions.push(cb);
  }
}

export function route(path, component) {
  return {
    path,
    component
  };
}
