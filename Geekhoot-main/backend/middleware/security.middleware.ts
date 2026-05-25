import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Paths that should bypass CSRF validation
const EXCLUDE_PATHS = ["/uploads"];

/**
 * Recursively sanitizes string inputs to prevent XSS attacks by removing script tags,
 * stripping inline event handlers, and escaping raw HTML brackets.
 */
const sanitizeValue = (val: any): any => {
  if (typeof val === "string") {
    return val
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "") // Strip script tags completely
      .replace(/on\w+\s*=\s*"[^"]*"/gi, "") // Strip inline handlers e.g. onload="..."
      .replace(/on\w+\s*=\s*'[^']*'/gi, "") // Strip inline handlers e.g. onload='...'
      .replace(/on\w+\s*=\s*[^>\s]+/gi, "") // Strip inline handlers e.g. onload=...
      .replace(/javascript:/gi, "") // Strip javascript: protocol
      .replace(/</g, "&lt;") // Escape brackets
      .replace(/>/g, "&gt;");
  }

  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }

  if (val !== null && typeof val === "object") {
    const sanitized: Record<string, any> = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        sanitized[key] = sanitizeValue(val[key]);
      }
    }
    return sanitized;
  }

  return val;
};

/**
 * Middleware to enable robust double-submit cookie CSRF protection.
 * - For GET, HEAD, and OPTIONS, generates a fresh XSRF-TOKEN cookie if missing.
 * - For POST, PUT, DELETE, and PATCH, compares the incoming cookie against the X-XSRF-TOKEN header.
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Bypassed paths
  if (EXCLUDE_PATHS.some((p) => req.path.startsWith(p))) {
    return next();
  }

  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) {
    if (!req.cookies || !req.cookies["XSRF-TOKEN"]) {
      const token = crypto.randomBytes(24).toString("hex");
      res.cookie("XSRF-TOKEN", token, {
        httpOnly: false, // Visible to our client-side code
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }
    return next();
  }

  // Verification
  const cookieValue = req.cookies && req.cookies["XSRF-TOKEN"];
  const headerValue = req.headers["x-xsrf-token"] || req.headers["x-csrf-token"];

  if (!cookieValue || !headerValue || cookieValue !== headerValue) {
    console.warn(`[CSRF Blocked] Route: ${req.method} ${req.path} | Cookie present: ${!!cookieValue} | Header present: ${!!headerValue}`);
    return res.status(403).json({
      status: "error",
      statusCode: 403,
      message: "CSRF token validation failed. Unauthorized cross-site request detected.",
    });
  }

  next();
};

/**
 * Middleware to clean incoming body, query, and param payloads from XSS payloads.
 */
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }
  if (req.query) {
    req.query = sanitizeValue(req.query);
  }
  if (req.params) {
    req.params = sanitizeValue(req.params);
  }
  next();
};
