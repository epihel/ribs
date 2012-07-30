(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function($) {
    var walk_context;
    window.Ribs = {};
    Ribs.dispatcher = _.extend({}, Backbone.Events);
    Ribs._boundJumpKeys = {};
    Ribs._jumpPrefixKey = "g";
    Ribs._jumpTimeout = 1000;
    Ribs._poiseJump = function() {
      Ribs._readyToJump = true;
      clearTimeout(Ribs._jumpInterval);
      return Ribs._jumpInterval = setTimeout(function() {
        return Ribs._readyToJump = false;
      }, Ribs._jumpTimeout);
    };
    Ribs._makeJump = function(charcode) {
      var bindings;
      Ribs._readyToJump = false;
      clearTimeout(Ribs._jumpTimeout);
      bindings = Ribs._boundJumpKeys[charcode];
      if ((bindings != null) && bindings.length > 0) {
        return _.each(bindings, function(binding) {
          if (!((binding.el != null) && $(binding.el).is(":hidden"))) {
            return binding.fn.apply(binding.ctx);
          }
        });
      }
    };
    Ribs.bindJumpKey = function(label, key, fn, ctx, el) {
      var charCode, _base;
      charCode = key.charCodeAt(0);
      if (!(el != null) && ctx instanceof Backbone.View) {
        el = ctx.el;
      }
      (_base = Ribs._boundJumpKeys)[charCode] || (_base[charCode] = []);
      Ribs._boundJumpKeys[charCode].push({
        label: label,
        fn: fn,
        ctx: ctx,
        el: el,
        key: key
      });
      return charCode;
    };
    Ribs.unbindJumpKey = function(key, ctx) {
      var charCode;
      charCode = key.charCodeAt(0);
      return _.each(Ribs._boundJumpKeys[charCode], function(binding, i) {
        if (binding.ctx === ctx) {
          Ribs._boundJumpKeys[charCode].splice(i, 1);
          if (Ribs._boundJumpKeys[charCode].length === 0) {
            return delete Ribs._boundJumpKeys[charCode];
          }
        }
      });
    };
    Ribs._registeredListViews = {};
    Ribs.showKeyboardBindings = function() {
      var className, keys, overlay, ul;
      className = "ribs-hotkeys-overlay";
      $("." + className).remove();
      overlay = $.el.div({
        "class": className
      });
      ul = $.el.ul();
      $(overlay).append($.el.h1("Navigation"), ul);
      _.each(_.flatten(Ribs._boundJumpKeys), function(binding) {
        var li;
        if (!(binding.el && $(binding.el).is(":hidden"))) {
          li = $.el.li({
            "class": "hotkey"
          }, $.el.span({
            "class": "jump key"
          }, "g" + binding.key), $.el.span({
            "class": "action"
          }, "Go to " + binding.label));
          return $(ul).append(li);
        }
      });
      keys = [
        {
          key: "?",
          label: "Open this page"
        }, {
          key: "j",
          label: "Next item"
        }, {
          key: "J",
          label: "Last item"
        }, {
          key: "k",
          label: "Previous item"
        }, {
          key: "K",
          label: "First item"
        }, {
          key: "x",
          label: "Select/deselect item"
        }, {
          key: "X",
          label: "Select/deselect all"
        }, {
          key: "_",
          label: "Expand/collapse list"
        }, {
          key: "R",
          label: "Refresh items"
        }
      ];
      _.each(keys, function(binding) {
        var li;
        li = $.el.li({
          "class": "hotkey"
        }, $.el.span({
          "class": "key"
        }, binding.key), $.el.span({
          "class": "action"
        }, binding.label));
        return $(ul).append(li);
      });
      _.each(Ribs._registeredListViews, function(view) {
        var h1;
        if (!$(view.el).is(":hidden")) {
          h1 = $.el.h1(view.plural());
          ul = $.el.ul();
          $(overlay).append(h1, ul);
          return _.each(view.actions, function(action) {
            var li;
            if (action.hotkey != null) {
              li = $.el.li({
                "class": "hotkey"
              }, $.el.span({
                "class": "key"
              }, action.hotkey), $.el.span({
                "class": "action"
              }, action.label));
              return $(ul).append(li);
            }
          });
        }
      });
      $(overlay).bind('dblclick', function() {
        $(overlay).remove();
        return false;
      });
      $(window).bind('keyup', function(event) {
        var _ref;
        if ((_ref = event.which) === 13 || _ref === 27) {
          $(overlay).remove();
        }
        return false;
      });
      $("body").append(overlay);
      return overlay;
    };
    $(window).on("keypress", function(event) {
      var prefix;
      if (!$(":focus").is("input:text, textarea")) {
        prefix = Ribs._jumpPrefixKey.charCodeAt(0);
        if (event.which === prefix && !Ribs._readyToJump) {
          return Ribs._poiseJump();
        } else if (Ribs._readyToJump) {
          return Ribs._makeJump(event.which);
        } else if (event.which === 63) {
          return Ribs.showKeyboardBindings();
        }
      }
    });
    Ribs.ListItem = (function(_super) {

      __extends(ListItem, _super);

      ListItem.prototype.tagName = "li";

      ListItem.prototype.className = "item";

      ListItem.prototype.attributes = {
        tabindex: 0
      };

      ListItem.prototype._ribsEvents = {
        'click': 'toggle',
        'toggle': 'toggle',
        'select': 'select',
        'deselect': 'deselect',
        'click a': 'stopPropogation',
        'keypress': 'keypressed'
      };

      function ListItem(options) {
        this.events || (this.events = {});
        _.extend(this.events, this._ribsEvents);
        ListItem.__super__.constructor.call(this, options);
        this.view = options.view;
        this.model.on('change', this.render, this);
        this.model.on('remove', this.remove, this);
        this.model.on('stealfocus', this.stealfocus, this);
      }

      ListItem.prototype.render = function() {
        var attributes, obj, toggle, _ref,
          _this = this;
        this.$el.empty();
        this.$el.data("cid", this.model.cid);
        toggle = $.el.input({
          type: "checkbox",
          tabindex: -1
        });
        if (this.$el.is(".selected")) {
          $(toggle).attr("checked", true);
        }
        this.$el.append($.el.div({
          "class": "toggle"
        }, toggle));
        obj = this.model.toJSON();
        attributes = (_ref = this.view.displayAttributes) != null ? _ref : _.map(obj, function(v, k) {
          return {
            field: k
          };
        });
        _.each(attributes, function(attribute) {
          var klass, value, _ref1;
          klass = (_ref1 = attribute["class"]) != null ? _ref1 : attribute.field;
          value = walk_context(attribute.field, obj);
          if ("map" in attribute) {
            value = attribute.map(value);
          }
          return _this.$el.append($.el.div({
            "class": klass
          }, value));
        });
        return _.each(this.view.inlineActions, function(action, key) {
          return _this.$el.append(action.renderInline(_this));
        });
      };

      ListItem.prototype.toggle = function() {
        if (!this.$el.is(".disabled")) {
          if (this.$el.is(".selected")) {
            return this.deselect();
          } else {
            return this.select();
          }
        }
      };

      ListItem.prototype.stopPropogation = function(e) {
        return e.stopImmediatePropagation();
      };

      ListItem.prototype.select = function(event, options) {
        if (options == null) {
          options = {};
        }
        this.$el.addClass("selected");
        this.$el.find("input:checkbox").attr("checked", "checked");
        if (!options.silent) {
          return this.model.trigger("selected");
        }
      };

      ListItem.prototype.deselect = function(event, options) {
        if (options == null) {
          options = {};
        }
        this.$el.removeClass("selected");
        this.$el.find("input:checkbox").removeAttr("checked");
        if (!options.silent) {
          return this.model.trigger("deselected");
        }
      };

      ListItem.prototype.enable = function() {
        this.$el.removeClass("disabled");
        this.$el.find("input:checkbox").removeAttr("disabled");
        this.$el.attr("tabindex", 0);
        return this.model.trigger("enabled");
      };

      ListItem.prototype.disable = function() {
        this.$el.addClass("disabled");
        this.$el.find("input:checkbox").attr("disabled", "disabled");
        this.$el.attr("tabindex", -1);
        return this.model.trigger("disabled");
      };

      ListItem.prototype.keypressed = function(event) {
        var _ref;
        if ((_ref = event.which) === 13 || _ref === 120) {
          return this.toggle();
        } else if (this.view.inlineActions.length) {
          return event.originalEvent.listItem = this;
        }
      };

      ListItem.prototype.stealfocus = function() {
        return this.$el.focus();
      };

      return ListItem;

    })(Backbone.View);
    Ribs.List = (function(_super) {

      __extends(List, _super);

      List.prototype.itemView = Ribs.ListItem;

      List.prototype.tagName = "div";

      List.prototype.className = "ribs";

      List.prototype.itemName = "item";

      List.prototype._ribsEvents = {
        'keypress': 'keypressed',
        'focusin': 'focusin',
        'focusout': 'focusout',
        'click .header .toggle': 'toggleSelected'
      };

      List.prototype.jumpSelector = ".list li:first";

      List.prototype.focussed = false;

      List.prototype.selectedByDefault = false;

      List.prototype.stopPropogation = function(e) {
        return e.preventDefault();
      };

      function List(options) {
        var key;
        this.sortArrows = {};
        this.sortArrows[-1] = "↓";
        this.sortArrows[1] = "↑";
        this.events || (this.events = {});
        _.extend(this.events, this._ribsEvents);
        _.extend(this, options);
        key = _.uniqueId('ribs_view_');
        Ribs._registeredListViews[key] = this;
        List.__super__.constructor.call(this, options);
        this.initializeTitle();
        this.initializeActions();
        this.initializeHeader();
        this.initializeList();
        this.initializeFooter();
        this.addAllItems();
        if (this.jumpkey != null) {
          Ribs.bindJumpKey(this.plural(), this.jumpkey, function() {
            return this.$el.find(this.jumpSelector).focus();
          }, this);
        }
        this.collection.on("add", this.addItem, this);
        this.collection.on("reset", this.addAllItems, this);
        this.collection.on("selected deselected reset add remove", this.updateHeader, this);
        this.collection.on("selected deselected reset add remove", this.updateFooter, this);
      }

      List.prototype.getSelected = function() {
        var selected,
          _this = this;
        if (this.$list == null) {
          return [];
        }
        selected = this.$list.find(".item.selected").map(function(idx, el) {
          return _this.collection.getByCid($(el).data("cid"));
        });
        return selected;
      };

      List.prototype.getNumSelected = function() {
        if (this.$list == null) {
          return 0;
        }
        return this.$list.find(".item.selected").size();
      };

      List.prototype.getNumTotal = function() {
        if (this.collection == null) {
          return 0;
        }
        return this.collection.length;
      };

      List.prototype.toggleSelected = function(event) {
        if (this.selectedByDefault === true) {
          this.$list.find(".item.selected").trigger("deselect", {
            silent: true
          });
          this.selectedByDefault = false;
          return this.collection.trigger("deselected");
        } else {
          this.$list.find(".item:not(.selected)").trigger("select", {
            silent: true
          });
          this.selectedByDefault = true;
          return this.collection.trigger("selected");
        }
      };

      List.prototype.invertSelected = function() {
        var toDeselect, toSelect;
        toSelect = this.$list.find(":not(.item.selected)");
        toDeselect = this.$list.find(".item.selected");
        toSelect.trigger("select");
        return toDeselect.trigger("deselect");
      };

      List.prototype.toggleVisibility = function() {
        this.$header.find(".maximize, .minimize").toggle();
        if (this.$el.attr("class") == null) {
          this.$el.attr("class", "");
        }
        return this.$el.toggleClass("minimized", 100);
      };

      List.prototype.sortBy = function(field, old_field) {
        var dir, el, label, old_el, old_label, re, _ref, _ref1, _ref2;
        re = new RegExp(" (" + (_.values(this.sortArrows).join("|")) + ")$|$");
        dir = (_ref = this.collection.sortingDirection[field]) != null ? _ref : 1;
        this.collection.trigger('sorted', field, dir);
        if (old_field != null) {
          old_el = this.$header.find("[data-sort-by='" + old_field + "']");
          old_label = (_ref1 = old_el.html()) != null ? _ref1.replace(re, "") : void 0;
          $(old_el).html(old_label);
        }
        el = this.$header.find("[data-sort-by='" + field + "']");
        label = (_ref2 = $(el).html()) != null ? _ref2.replace(re, " " + this.sortArrows[dir]) : void 0;
        return $(el).html(label);
      };

      List.prototype.sortCollectionBy = function(field) {
        var dir, old_field, _base,
          _this = this;
        old_field = this.collection.sortingBy;
        (_base = this.collection).sortingDirection || (_base.sortingDirection = {});
        this.collection.sortingBy = field;
        if (field === old_field && field in this.collection.sortingDirection) {
          this.collection.sortingDirection[field] *= -1;
        } else {
          this.collection.sortingDirection[field] = 1;
        }
        dir = this.collection.sortingDirection[field];
        if (this.collection.remoteSort) {
          return;
        }
        this.collection.comparator = function(ma, mb) {
          var a, b;
          a = walk_context(field, ma.toJSON());
          b = walk_context(field, mb.toJSON());
          if (a === b) {
            return 0;
          }
          if (a > b || !(b != null)) {
            return +1 * dir;
          }
          if (a < b || !(a != null)) {
            return -1 * dir;
          }
        };
        this.collection.sort();
        return this.sortBy(field, old_field);
      };

      List.prototype.keypressed = function(event) {
        var _this = this;
        if (!(Ribs._readyToJump || $(":focus").is("input:text, textarea"))) {
          if (event.which === 106) {
            return $(":focus").nextAll(".item:not(.disabled):first").focus();
          } else if (event.which === 107) {
            return $(":focus").prevAll(".item:not(.disabled):first").focus();
          } else if (event.which === 74) {
            return this.$list.find(".item:last").focus();
          } else if (event.which === 75) {
            return this.$list.find(".item:first").focus();
          } else if (event.which === 95) {
            return this.toggleVisibility();
          } else if (event.which === 88) {
            return this.toggleSelected();
          } else if (event.which === 82) {
            if (this.collection.url != null) {
              return this.collection.fetch({
                success: function() {
                  var _ref;
                  return (_ref = _this.$list.find(":first")) != null ? _ref.focus() : void 0;
                }
              });
            }
          } else {
            return this.trigger("keypressed", event);
          }
        }
      };

      List.prototype.focusin = function(event) {
        if (!this.focussed) {
          this.focussed = true;
        }
        this.$el.addClass("focussed");
        return this.collection.trigger("focusin");
      };

      List.prototype.focusout = function(event) {
        var _this = this;
        if (this.focussed) {
          return setTimeout(function() {
            if (_this.$el.find(document.activeElement).length === 0) {
              _this.$el.removeClass("focussed");
            }
            _this.focussed = false;
            return _this.collection.trigger("focusout");
          }, 10);
        }
      };

      List.prototype.plural = function() {
        var _ref;
        return (_ref = this.itemNamePlural) != null ? _ref : this.itemName + "s";
      };

      List.prototype.initializeTitle = function() {
        var title, _ref;
        if (this.suppressTitle == null) {
          title = (_ref = this.title) != null ? _ref : this.plural();
          this.$title = $($.el.h1({
            "class": "title"
          }, title));
          return this.$el.append(this.$title);
        }
      };

      List.prototype.initializeActions = function() {
        var _this = this;
        this.$batchActions = $($.el.ul({
          "class": "actions"
        }));
        this.$el.append(this.$batchActions);
        this.batchActions = [];
        this.inlineActions = [];
        _.each(this.actions, function(actionConfig) {
          var action;
          actionConfig.collection = _this.collection;
          actionConfig.view = _this;
          action = new Ribs.Action(actionConfig);
          if (action.inline) {
            _this.inlineActions.push(action);
          }
          if (action.batch !== false) {
            _this.batchActions.push(action);
            action.render();
            return _this.$batchActions.append(action.el);
          }
        });
        return this.$batchActions;
      };

      List.prototype.initializeList = function() {
        this.$list = $($.el.ul({
          "class": "list"
        }));
        this.$el.append(this.$list);
        return this.$list;
      };

      List.prototype.addAllItems = function() {
        this.$list.empty();
        return this.collection.each(this.addItem, this);
      };

      List.prototype.addItem = function(model_instance) {
        var view;
        view = new this.itemView({
          model: model_instance,
          view: this
        });
        view.render();
        this.$list.append(view.el);
        if (this.selectedByDefault) {
          return view.$el.trigger("select");
        }
      };

      List.prototype.initializeHeader = function() {
        var attributes, toggle,
          _this = this;
        this.$header = $($.el.div({
          "class": "header"
        }));
        this.$el.append(this.$header);
        toggle = $.el.input({
          type: "checkbox",
          tabindex: -1
        });
        if (this.selectedByDefault) {
          $(toggle).attr("checked", "checked");
        }
        this.$header.append($.el.div({
          "class": "toggle"
        }, toggle));
        if (this.displayAttributes != null) {
          attributes = this.displayAttributes;
        } else {
          attributes = _.map(this.collection.first().toJSON(), function(v, k) {
            return {
              field: k
            };
          });
        }
        _.each(attributes, function(attribute) {
          var klass, label, _ref, _ref1;
          label = (_ref = attribute.label) != null ? _ref : attribute.field;
          klass = (_ref1 = attribute["class"]) != null ? _ref1 : attribute.field;
          return _this.$header.append($.el.div({
            "class": klass,
            "data-sort-by": attribute.field
          }, label));
        });
        this.$header.find(".maximize, .minimize").click(function() {
          return _this.toggleVisibility();
        });
        this.$header.find("[data-sort-by]").click(function(event) {
          var field;
          field = $(event.target).attr("data-sort-by");
          if (field != null) {
            return _this.sortCollectionBy(field);
          }
        });
        this.$header.find("[data-sort-by=" + this.collection.sortingBy + "]").append(" " + this.sortArrows[1]);
        return this.$header;
      };

      List.prototype.updateHeader = function() {
        var isChecked, isTransparent, l, n, opacity;
        n = this.getNumSelected();
        l = this.getNumTotal();
        if (n >= l) {
          this.selectedByDefault = true;
        }
        if (n === 0) {
          this.selectedByDefault = false;
        }
        isChecked = n !== 0;
        isTransparent = isChecked && n < l;
        opacity = isTransparent ? 0.5 : 1;
        return this.$header.find(".toggle input").attr("checked", isChecked).css("opacity", opacity);
      };

      List.prototype.initializeFooter = function() {
        this.$footer = $($.el.div({
          "class": "footer"
        }));
        this.$el.append(this.$footer);
        this.updateFooter();
        return this.$footer;
      };

      List.prototype.updateFooter = function() {
        var plural, word;
        plural = this.getNumTotal() !== 1;
        word = plural ? this.plural() : this.itemName;
        return this.$footer.text("" + (this.getNumSelected()) + " / " + (this.getNumTotal()) + " " + word + " selected");
      };

      return List;

    })(Backbone.View);
    Ribs.DropDownItem = (function(_super) {

      __extends(DropDownItem, _super);

      DropDownItem.prototype.tagName = "option";

      DropDownItem.prototype.labelField = "name";

      DropDownItem.prototype.valueField = "id";

      DropDownItem.prototype.attributes = function() {
        return {
          value: this.model.get(this.valueField)
        };
      };

      function DropDownItem(options) {
        DropDownItem.__super__.constructor.call(this, options);
        this.model.on('change', this.render, this);
        this.model.on('remove', this.remove, this);
      }

      DropDownItem.prototype.render = function() {
        this.$el.text(this.model.get(this.labelField));
        this.$el.data("cid", this.model.cid);
        return this.$el;
      };

      DropDownItem.prototype.enable = function() {
        return this.$el.removeAttr("disabled");
      };

      DropDownItem.prototype.disable = function() {
        return this.$el.attr("disabled", "disabled");
      };

      DropDownItem.prototype.select = function() {
        return this.$el.attr("selected", "selected");
      };

      DropDownItem.prototype.deselect = function() {
        return this.$el.removeAttr("selected");
      };

      return DropDownItem;

    })(Backbone.View);
    Ribs.DropDown = (function(_super) {

      __extends(DropDown, _super);

      DropDown.prototype.tagName = "select";

      DropDown.prototype._ribsEvents = {
        'change': 'change'
      };

      function DropDown(options) {
        var _ref;
        this.events || (this.events = {});
        _.extend(this.events, this._ribsEvents);
        DropDown.__super__.constructor.call(this, options);
        this.jumpkey = (_ref = this.jumpkey) != null ? _ref : options.jumpkey;
        if (this.jumpkey != null) {
          Ribs.bindJumpKey("dropdown", this.jumpkey, function() {
            return this.$el.focus();
          }, this, this.$el);
        }
        this.collection.on("add", this.addOne, this);
        this.collection.on("reset", this.addAll, this);
        this.addAll();
      }

      DropDown.prototype.addAll = function() {
        this.$el.empty();
        this.collection.each(this.addOne, this);
        if (this.collection.first()) {
          this.collection.first().trigger("selected");
        }
        return this.$el.trigger("reload");
      };

      DropDown.prototype.addOne = function(model_instance) {
        var view;
        view = new Ribs.DropDownItem({
          model: model_instance
        });
        view.render();
        return this.$el.append(view.el);
      };

      DropDown.prototype.change = function(event) {
        var cid, model;
        cid = this.$el.find(":selected").data("cid");
        model = this.collection.getByCid(cid);
        model.trigger("selected");
        return true;
      };

      return DropDown;

    })(Backbone.View);
    Ribs.Action = (function(_super) {

      __extends(Action, _super);

      Action.prototype.tagName = "li";

      Action.prototype.className = "action";

      Action.prototype._ribsEvents = {
        'click': 'triggerAction',
        'keypress': 'keypressedHere'
      };

      function Action(options) {
        this.min = 1;
        this.max = -1;
        this.arity = null;
        this.check = null;
        this.events || (this.events = {});
        _.extend(this.events, this._ribsEvents);
        _.extend(this, options);
        Action.__super__.constructor.call(this, options);
        if (this.collection != null) {
          this.collection.on("selected deselected reset", this.checkRequirements, this);
          if (this.hotkey != null) {
            this.view.on("keypressed", this.keypressedOnView, this);
          }
        }
        this.checkRequirements();
      }

      Action.prototype.checkRequirements = function() {
        var enable;
        enable = this.allowed();
        if (!enable) {
          this.disable();
        }
        if (enable) {
          return this.enable();
        }
      };

      Action.prototype.allowed = function(l) {
        var a, allow, r1, r2, r3;
        l || (l = this.view.getNumSelected());
        allow = false;
        if (this.arity != null) {
          a = this.arity;
          r1 = a === l;
          r2 = a === -1;
          r3 = !!(a % 1) && l >= Math.floor(a);
          allow = r1 || r2 || r3;
        } else {
          r1 = this.min === -1 || l >= this.min;
          r2 = this.max === -1 || l <= this.max;
          allow = r1 && r2;
        }
        if (allow && (this.check != null)) {
          allow = this.check.apply(this.view, [this.collection.selected()]);
        }
        return allow;
      };

      Action.prototype.disable = function() {
        this.$el.addClass("disabled");
        return this.$el.find(".button").attr("tabindex", -1);
      };

      Action.prototype.enable = function() {
        this.$el.removeClass("disabled");
        return this.$el.find(".button").attr("tabindex", 0);
      };

      Action.prototype.triggerAction = function(event, listItem) {
        if (!this.$el.is(".disabled") && this.allowed()) {
          return this.activate.call(this.view, this.view.getSelected(), listItem);
        }
      };

      Action.prototype.triggerActionInline = function(event, listItem) {
        if (!listItem.$el.is(".disabled")) {
          return this.activate.call(this.view, [listItem.model], listItem);
        }
      };

      Action.prototype.keypressedHere = function(event) {
        if (event.which === 13) {
          this.triggerAction(event);
          return false;
        }
        return true;
      };

      Action.prototype.keypressedOnView = function(event) {
        var listItem;
        if ((this.hotkey != null) && this.hotkey.charCodeAt(0) === event.which) {
          listItem = event.originalEvent.listItem;
          if ((listItem != null) && (this.inline != null)) {
            this.triggerActionInline(event, listItem);
          } else {
            this.triggerAction(event, listItem);
          }
          return false;
        }
      };

      Action.prototype.render = function() {
        return this.$el.html(this.drawButton());
      };

      Action.prototype.drawButton = function(inline) {
        var btn, label, tabindex, _ref, _ref1;
        if (inline == null) {
          inline = false;
        }
        if (inline || !this.$el.is(".disabled")) {
          tabindex = 0;
        } else {
          tabindex = -1;
        }
        btn = $.el.div({
          "class": "button",
          tabindex: tabindex
        });
        if (inline) {
          label = (_ref = this.inlineLabel) != null ? _ref : this.label;
        } else {
          label = (_ref1 = this.batchLabel) != null ? _ref1 : this.label;
          if ((this.hotkey != null) && !this.inline) {
            label = this.constructor.highlightHotkey(label, this.hotkey);
          }
        }
        $(btn).html(label);
        $(btn).attr("title", this.label);
        return $(btn);
      };

      Action.prototype.renderInline = function(listItem) {
        var btn,
          _this = this;
        btn = this.drawButton(true);
        btn.addClass("inline");
        $(btn).on("click", function(event) {
          _this.triggerActionInline(event, listItem);
          return false;
        });
        $(btn).on("keypress", function(event) {
          if (event.which === 13) {
            _this.triggerActionInline(event, listItem);
            return false;
          }
        });
        return btn;
      };

      Action.highlightHotkey = function(label, hotkey) {
        var char, new_label;
        char = hotkey;
        new_label = label.replace(char, "<span class='hotkey'><strong>" + char + "</strong></span>");
        if (label === new_label) {
          new_label = "" + label + " <span class='hotkey'>[<strong>" + char + "</strong>]</span>";
        }
        return new_label;
      };

      return Action;

    })(Backbone.View);
    return walk_context = function(name, context) {
      var path, value;
      path = name.split(".");
      value = context[path.shift()];
      while ((value != null) && path.length > 0) {
        context = value;
        value = context[path.shift()];
      }
      if (typeof value === "function") {
        return value.apply(context);
      }
      return value;
    };
  })(jQuery);

}).call(this);