'use strict';

var $ = require("cheerio");
var _ = require_vendor("underscore");
var page = require_core("server/page");
var template = require_core("server/template");

var auth = require_app("server/auth");
var dashboard_controller = require_app("controllers/dashboard/server");

module.exports = {
  routes: {
    "" : "index"
  },

  render_dashboards: function(cb) {
    dashboard_controller.get_dashboards(null, function(results) {
      var dashes = $("<div />");

      _.each(results, function(dashboard) {
        var dashEl = $("<a>").html(dashboard);
        dashEl.attr('href', '/dashboard?id=' + dashboard);
        var header = $("<h2>");
        header.append(dashEl);
        dashes.append(header);
      });

      cb(dashes.toString());
    });
  },

  index: auth.require_user(function() {
      var header_str = template.render("helpers/header.html.erb");
      var render_dashboards = page.async(this.render_dashboards);
      var template_str = template.render("controllers/dashboards.html.erb", {
        render_dashboards: render_dashboards
      });


      $C("modal", {}).marshall();
      template.add_stylesheet("dashboards");
      page.render({ content: template_str, header: header_str, component: true, socket: true });

  }),

  socket: function(socket) {
    socket.on("new_dashboard", function(dashboard, fn) {
      var dashboard_controller = require_app("controllers/dashboard/server");
      dashboard_controller.new_dashboard(socket, dashboard, function(err) {
        if (err) {
          fn("NOK");
        } else {
          fn("OK");
        }
      });
    });

  
  }
};
