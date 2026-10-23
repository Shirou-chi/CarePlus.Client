import { nextTrail } from "./breadcrumb-trail.ts";

let trail = nextTrail([], "/account", "POP");
trail = nextTrail(trail, "/notifications", "PUSH");
if (trail.join() !== "/account,/notifications") throw new Error("account to notifications");

trail = nextTrail(trail, "/cart", "PUSH");
if (trail.join() !== "/account,/notifications,/cart") throw new Error("on to cart");

trail = nextTrail([], "/book", "PUSH");
trail = nextTrail(trail, "/doctors", "PUSH");
if (trail.join() !== "/book,/doctors") throw new Error("booking to doctors");

trail = nextTrail(trail, "/book", "PUSH");
if (trail.join() !== "/book") throw new Error("back to an earlier page");

trail = nextTrail(["/account"], "/invoices", "REPLACE");
if (trail.join() !== "/account,/invoices") throw new Error("redirect keeps the page you left");

if (nextTrail(["/book", "/doctors"], "/home", "PUSH").length !== 0) throw new Error("home clears the trail");

console.log("breadcrumb trail ok");
