import Gtk from "https://gir.deno.dev/Gtk-4.0";
import GLib from "https://gir.deno.dev/GLib-2.0";
import { toCamelCase, toKebabCase } from "https://deno.land/x/deno_gi/src/utils/string.ts";
import { ObjectByGType } from "https://deno.land/x/deno_gi/src/utils/object.ts";
import { parseStyle } from "./css.js";
import ReactReconciler from "npm:react-reconciler";

function updateStyle(object, style) {
  const context = object.getStyleContext();
  if (object.__css_provider__) {
    context.removeProvider(object.__css_provider__);
  }
  const parsedStyle = new TextEncoder().encode(parseStyle(style));
  const provider = new Gtk.CssProvider();
  provider.loadFromData(parsedStyle, parsedStyle.length);
  context.addProvider(provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
  object.__css_provider__ = provider;
}

function getSignalName(klass, propName) {
  if (!propName.startsWith("on")) {
    return;
  }

  const sigName = toKebabCase(propName).replace(":", "::").substring(3);

  if (Object.hasOwn(klass.__signals__, sigName.split("::")[0])) {
    return [propName, sigName];
  }
}

const builder = new Gtk.Builder();

const reconciler = ReactReconciler({
  supportsMutation: true,
  isPrimaryRenderer: true,

  createInstance(type, props, _rootContainer, _hostContext, _internalHandle) {
    const name = toCamelCase(type);
    let gType = builder.getTypeFromName(name);
    if (gType < Number.MAX_SAFE_INTEGER) {
      gType = Number(gType);
    }

    const klass = ObjectByGType(gType);

    const {
      children: _children,
      role: _role,
      style,
      ...properties
    } = props;
    const signals = {};
    Object.keys(properties)
      .map((propName) => getSignalName(klass, propName))
      .filter((a) => !!a)
      .forEach(([key, sigName]) => {
        signals[sigName] = properties[key];
        delete properties[key];
      });

    const object = new klass(properties);

    if (style) {
      updateStyle(object, style);
    }

    Object.entries(signals)
      .forEach(([sigName, callback]) => object.on(sigName, callback));

    return object;
  },

  createTextInstance(text, _rootContainer, _hostContext, _internalHandle) {
    return Gtk.Label.new(text);
  },

  appendInitialChild(parentInstance, child) {
    parentInstance.addChild(builder, child, child.role);
  },
  appendChild(parentInstance, child) {
    parentInstance.addChild(builder, child, child.role);
  },

  appendChildToContainer(container, child) {
    child.application = container;
    child.show();
  },
  detachDeletedInstance(_instance) {
  },

  finalizeInitialChildren(
    _instance,
    _type,
    _props,
    _rootContainer,
    _hostContext,
  ) {
    return false;
  },

  prepareUpdate(
    instance,
    _type,
    oldProps,
    newProps,
    _rootContainer,
    _hostContext,
  ) {
    const { children: _new_children, ...updatedProps } = newProps;
    const { children: _old_children, ...removedProps } = oldProps;

    for (const propName of Object.keys(updatedProps)) {
      if (getSignalName(instance.constructor, propName)) {
        delete updatedProps[propName];
        delete removedProps[propName];
      }

      if (updatedProps[propName] === removedProps[propName]) {
        delete updatedProps[propName];
      }

      delete removedProps[propName];
    }

    return { updatedProps, removedProps };
  },

  shouldSetTextContent(_type, _props) {},
  getRootHostContext(_rootContainer) {},
  getChildHostContext(_parentHostContext, _type, _rootContainer) {},
  getPublicInstance(instance) {
    return instance;
  },
  prepareForCommit(_containerInfo) {},
  resetAfterCommit(_containerInfo) {},
  preparePortalMount(_containerInfo) {},
  scheduleTimeout(_fn, _delay) {},
  cancelTimeout(_id) {},

  insertBefore(parentInstance, child, beforeChild) {
    parentInstance.addChild(builder, child, child.role);
    while (child.getParent().__ref__ !== beforeChild.getParent().__ref__) {
      child = child.getParent();
      beforeChild = beforeChild.getParent();
    }
    child.insertBefore(parentInstance, beforeChild);
  },

  insertInContainerBefore(container, child, beforeChild) {
    container.addChild(builder, child, child.role);
    while (child.getParent().__ref__ !== beforeChild.getParent().__ref__) {
      child = child.getParent();
      beforeChild = beforeChild.getParent();
    }
    child.insertBefore(container, beforeChild);
  },

  removeChild(_parentInstance, child) {
    child.hide();
  },
  removeChildFromContainer(container, child) {
    child.hide();
  },

  resetTextContent(_instance) {},
  commitTextUpdate(textInstance, _prevText, nextText) {
    textInstance.setLabel(nextText);
  },

  commitMount(_instance, _type, _props, _internalHandle) {},
  commitUpdate(
    instance,
    updatePayload,
    _type,
    _prevProps,
    _nextProps,
    _internalHandle,
  ) {
    const { updatedProps, removedProps } = updatePayload;

    for (const [propName, value] of Object.entries(updatedProps)) {
      if (propName === "style") {
        updateStyle(instance, value);
        continue;
      }
      instance[propName] = value;
    }
    for (const propName of Object.keys(removedProps)) {
      if (propName === "style") {
        updateStyle(instance, {});
        continue;
      }
      instance[propName] = undefined;
    }
  },

  hideInstance(instance) {
    instance.hide();
  },
  hideTextInstance(textInstance) {
    textInstance.hide();
  },
  unhideInstance(instance, _props) {
    instance.show();
  },
  unhideTextInstance(textInstance, _text) {
    textInstance.show();
  },
  clearContainer(_container) {},
});

const context = GLib.MainContext.default();
let isRunning = false;

function nextTick() {
  if (!isRunning) {
    return;
  }

  context.iteration();
  setTimeout(nextTick);
}

export function render(component, app) {
  app.on("startup", () => {
    const container = reconciler.createContainer(app, false, false);
    reconciler.updateContainer(component, container, null, null);
    isRunning = true;
    nextTick();
  });

  app.on("window-removed", () => {
    if (!app.getActiveWindow()) {
      isRunning = false;
    }
  });

  app.register(null, null);
}
