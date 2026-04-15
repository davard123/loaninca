import { onRequestDelete as __api___path___js_onRequestDelete } from "/Users/harry/Documents/my-web-site/functions/api/[[path]].js"
import { onRequestGet as __api___path___js_onRequestGet } from "/Users/harry/Documents/my-web-site/functions/api/[[path]].js"
import { onRequestPost as __api___path___js_onRequestPost } from "/Users/harry/Documents/my-web-site/functions/api/[[path]].js"
import { onRequestPut as __api___path___js_onRequestPut } from "/Users/harry/Documents/my-web-site/functions/api/[[path]].js"

export const routes = [
    {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api___path___js_onRequestDelete],
    },
  {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api___path___js_onRequestGet],
    },
  {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api___path___js_onRequestPost],
    },
  {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "PUT",
      middlewares: [],
      modules: [__api___path___js_onRequestPut],
    },
  ]