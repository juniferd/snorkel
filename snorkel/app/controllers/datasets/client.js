"use strict";

var _datasets = {};

require("core/client/component");
var helpers = require("app/client/views/helpers");

module.exports = {
  events: {
    "click .logout" : "handle_logout",
    "click .save" : "handle_save_metadata",
    "click .cancel" : "handle_discard_metadata",
    "click .clear_cache" : "handle_clear_metadata",
  },
  initialize: function() {
  },

  initialize_editor: function() {
    var $page = this.$page;
    $C("xeditable", {}, function() {
      var editables = $page.find(".manual.xeditable").editable();
    });

    this.column_config = [];
    var that = this;
    this.on("new_column_metadata", function(col) {
      that.column_config.push(col);
    });
  },

  set_table: function(table) {
    this.table = table;
  },

  handle_save_metadata: function() {
    var $page = this.$page;
    function get_value_from_xeditable(name) {
      var val = $page.find(".dataset_config [data-name=" + name + "]").editable('getValue')[name];
      return val;
    }

    var _metadata = {
      description: get_value_from_xeditable('description'),
      display_name: get_value_from_xeditable('display_name'),
      rss_feed: get_value_from_xeditable('rss_feed'),
      time_col: $page.find(".dataset_config select[name='time_col']").val(),
      columns: {}
    };

    _.each(this.column_config, function(col) {
      _metadata.columns[col.get_name()] = col.get_config();
    });

    SF.socket().emit("set_metadata", this.table, _metadata);
    $page.find(".xeditable").removeClass("editable-unsaved");
    $page.find(".editable").removeClass("editable-unsaved");
  },

  handle_discard_metadata: function() {
    window.location.reload();
  },

  handle_logout: function() {
    $.post("/logout", function() {
      $(window.location).attr("href", "/");
    });
  },


  socket: function(socket) {
    socket.on("cleared_cache", function() {
      $C("modal", { title: "Successful Success!", body: "The metadata cache was cleared" });
    });

    socket.on("dropped", function(dataset) {
      console.log("DROPPED DATASET", dataset);
      _datasets[dataset].$el.fadeOut(function() {
        _datasets[dataset].remove();
        delete _datasets[dataset];
      });
    });

    socket.on("set_metadata", function(response) {
      console.log("SET DATASET:", response);
    });
  },

  handle_clear_metadata: function() {
    var dataset = this.table;
    console.log("CLEARING METADATA CACHE", dataset);
    SF.socket().emit("clear_cache", dataset);
  },
  delegates: {
    handle_delete_clicked: function(obj) {
      var dataset = obj.dataset;
      helpers.confirm_action({
        title: "Confirm dataset deletion",
        body: "You are about to drop the " + dataset + " dataset. Are you sure?",
        confirm: "Drop dataset"
      }, function() {
        _datasets[dataset] = obj;
        SF.socket().emit("drop", dataset);

      });
    }
  }
};
