import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET - Serve the tracking script
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params

  // Verify tracking ID exists
  const config = await db.websiteAnalyticsConfig.findUnique({
    where: { trackingId }
  })

  if (!config || !config.isEnabled) {
    return new NextResponse("// Invalid tracking ID", {
      status: 404,
      headers: { "Content-Type": "application/javascript" }
    })
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

  const script = `
(function() {
  'use strict';
  
  // SOULFLOW Analytics Script
  var SF = window.SF = window.SF || {};
  SF.trackingId = '${trackingId}';
  SF.endpoint = '${baseUrl}/api/analytics/track';
  SF.config = {
    trackPageViews: ${config.trackPageViews},
    trackClicks: ${config.trackClicks},
    trackForms: ${config.trackForms},
    trackScrollDepth: ${config.trackScrollDepth},
    trackOutboundLinks: ${config.trackOutboundLinks}
  };
  
  // Generate or get visitor ID
  SF.getVisitorId = function() {
    var vid = localStorage.getItem('sf_vid');
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem('sf_vid', vid);
    }
    return vid;
  };
  
  // Generate session ID
  SF.getSessionId = function() {
    var sid = sessionStorage.getItem('sf_sid');
    if (!sid) {
      sid = 's_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      sessionStorage.setItem('sf_sid', sid);
    }
    return sid;
  };
  
  // Get UTM parameters
  SF.getUTMParams = function() {
    var params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign'),
      utmTerm: params.get('utm_term'),
      utmContent: params.get('utm_content')
    };
  };
  
  // Detect device info
  SF.getDeviceInfo = function() {
    var ua = navigator.userAgent;
    var device = 'desktop';
    if (/Mobi|Android/i.test(ua)) device = 'mobile';
    if (/iPad|Tablet/i.test(ua)) device = 'tablet';
    
    var browser = 'Unknown';
    if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
    else if (ua.indexOf('Safari') > -1) browser = 'Safari';
    else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (ua.indexOf('Edge') > -1) browser = 'Edge';
    
    var os = 'Unknown';
    if (ua.indexOf('Windows') > -1) os = 'Windows';
    else if (ua.indexOf('Mac') > -1) os = 'macOS';
    else if (ua.indexOf('Linux') > -1) os = 'Linux';
    else if (ua.indexOf('Android') > -1) os = 'Android';
    else if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1) os = 'iOS';
    
    return { device: device, browser: browser, os: os, userAgent: ua };
  };
  
  // Send event to server
  SF.track = function(type, data) {
    var deviceInfo = SF.getDeviceInfo();
    var utmParams = SF.getUTMParams();
    
    var payload = Object.assign({
      trackingId: SF.trackingId,
      visitorId: SF.getVisitorId(),
      sessionId: SF.getSessionId(),
      type: type,
      pageUrl: window.location.href,
      pageTitle: document.title,
      pagePath: window.location.pathname,
      referrer: document.referrer
    }, deviceInfo, utmParams, data || {});
    
    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon(SF.endpoint, JSON.stringify(payload));
    } else {
      fetch(SF.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function() {});
    }
  };
  
  // Track page view
  SF.trackPageView = function() {
    if (SF.config.trackPageViews) {
      SF.track('PAGE_VIEW');
    }
  };
  
  // Track click
  SF.trackClick = function(element) {
    if (SF.config.trackClicks) {
      SF.track('CLICK', {
        elementId: element.id || null,
        elementClass: element.className || null,
        elementText: (element.innerText || '').substring(0, 100)
      });
    }
  };
  
  // Track form submission
  SF.trackForm = function(form) {
    if (SF.config.trackForms) {
      SF.track('FORM_SUBMIT', {
        elementId: form.id || null,
        elementClass: form.className || null
      });
    }
  };
  
  // Track conversion
  SF.trackConversion = function(goalName, data) {
    SF.track('CONVERSION', {
      eventName: goalName,
      eventData: data
    });
  };
  
  // Track custom event
  SF.trackEvent = function(eventName, data) {
    SF.track('CUSTOM', {
      eventName: eventName,
      eventData: data
    });
  };
  
  // Initialize tracking
  SF.init = function() {
    // Track initial page view
    SF.trackPageView();
    
    // Track clicks on buttons and links
    if (SF.config.trackClicks) {
      document.addEventListener('click', function(e) {
        var target = e.target.closest('a, button, [data-sf-track]');
        if (target) {
          SF.trackClick(target);
          
          // Track outbound links
          if (SF.config.trackOutboundLinks && target.tagName === 'A') {
            var href = target.getAttribute('href');
            if (href && href.indexOf('http') === 0 && href.indexOf(window.location.hostname) === -1) {
              SF.track('OUTBOUND_LINK', {
                pageUrl: href,
                elementText: (target.innerText || '').substring(0, 100)
              });
            }
          }
        }
      });
    }
    
    // Track form submissions
    if (SF.config.trackForms) {
      document.addEventListener('submit', function(e) {
        if (e.target.tagName === 'FORM') {
          SF.trackForm(e.target);
        }
      });
    }
    
    // Track scroll depth
    if (SF.config.trackScrollDepth) {
      var maxScroll = 0;
      var scrollMilestones = [25, 50, 75, 100];
      window.addEventListener('scroll', function() {
        var scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        scrollMilestones.forEach(function(milestone) {
          if (scrollPercent >= milestone && maxScroll < milestone) {
            maxScroll = milestone;
            SF.track('SCROLL_DEPTH', { scrollDepth: milestone });
          }
        });
      });
    }
    
    // Track page visibility changes (for single-page apps)
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') {
        SF.trackPageView();
      }
    });
  };
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', SF.init);
  } else {
    SF.init();
  }
})();
`

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    }
  })
}







