import { AppRegistry, DeviceEventEmitter, NativeEventEmitter, Platform } from 'react-native';
import React, { Component } from 'react';
import Navigator from './Navigator';
import NavigationModule from './NavigationModule';
import Garden from './Garden';
import router from './Router';

const EventEmitter = Platform.select({
  ios: new NativeEventEmitter(NavigationModule),
  android: DeviceEventEmitter,
});

let componentWrapperFunc;

let navigators = new Map();

function copy(obj = {}) {
  let target = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value && typeof value === 'object') {
      if (value.constructor === Array) {
        let array = [];
        target[key] = array;
        for (let i = 0; i < value.length; i++) {
          array.push(copy(value[i]));
        }
      } else {
        target[key] = copy(value);
      }
    } else {
      target[key] = value;
    }
  }
  return target;
}

export default {
  startRegisterComponent(componentWrapper) {
    console.info('begin register react component');
    router.clear();
    componentWrapperFunc = componentWrapper;
    NavigationModule.startRegisterReactComponent();
  },

  endRegisterComponent() {
    NavigationModule.endRegisterReactComponent();
    console.info('end register react component');
  },

  registerComponent(appKey, componentProvider, routeConfig) {
    const RealComponent = componentProvider();
    if (RealComponent.routeConfig) {
      RealComponent.routeConfig.moduleName = appKey;
      router.addRoute(appKey, RealComponent.routeConfig);
    }
    if (routeConfig) {
      router.addRoute(appKey, routeConfig);
    }

    class Screen extends Component {
      static InternalComponent = RealComponent;

      constructor(props) {
        super(props);
        if (navigators.has(props.sceneId)) {
          this.navigator = navigators.get(props.sceneId);
        } else {
          this.navigator = new Navigator(props.sceneId, appKey);
          navigators.set(props.sceneId, this.navigator);
        }
        this.options = copy(RealComponent.navigationItem);
        this.garden = new Garden(props.sceneId, this.options);
        this.events = [];
      }

      listenBarButtonItemClickEvent() {
        let event = EventEmitter.addListener('ON_BAR_BUTTON_ITEM_CLICK', event => {
          if (this.props.sceneId === event.sceneId && RealComponent.navigationItem) {
            // console.info(JSON.stringify(event));
            if (event.action === 'right_bar_button_item_click') {
              this.options.rightBarButtonItem.action(this.navigator);
            } else if (event.action === 'left_bar_button_item_click') {
              this.options.leftBarButtonItem.action(this.navigator);
            } else if (event.action.startsWith('right_bar_button_item_click_')) {
              let index = event.action.replace('right_bar_button_item_click_', '');
              this.options.rightBarButtonItems[index].action(this.navigator);
            } else if (event.action.startsWith('left_bar_button_item_click_')) {
              let index = event.action.replace('left_bar_button_item_click_', '');
              this.options.leftBarButtonItems[index].action(this.navigator);
            } else if (this.refs.real.onBarButtonItemClick) {
              this.refs.real.onBarButtonItemClick(event.action); // 向后兼容
            }
          }
        });
        this.events.push(event);
      }

      listenComponentResultEvent() {
        let event = EventEmitter.addListener('ON_COMPONENT_RESULT', event => {
          if (this.props.sceneId === event.sceneId && this.refs.real.onComponentResult) {
            this.refs.real.onComponentResult(event.requestCode, event.resultCode, event.data);
          }
        });
        this.events.push(event);
      }

      listenComponentResumeEvent() {
        // console.info('listenComponentResumeEvent');
        let event = EventEmitter.addListener('ON_COMPONENT_APPEAR', event => {
          if (this.props.sceneId === event.sceneId && this.refs.real.componentDidAppear) {
            this.refs.real.componentDidAppear();
          }
        });
        this.events.push(event);
      }

      listenComponentPauseEvent() {
        let event = EventEmitter.addListener('ON_COMPONENT_DISAPPEAR', event => {
          if (this.props.sceneId === event.sceneId && this.refs.real.componentDidDisappear) {
            this.refs.real.componentDidDisappear();
          }
        });
        this.events.push(event);
      }

      listenDialogBackPressedEvent() {
        let event = EventEmitter.addListener('ON_DIALOG_BACK_PRESSED', event => {
          if (this.props.sceneId === event.sceneId && this.refs.real.onBackPressed) {
            this.refs.real.onBackPressed();
          }
        });
        this.events.push(event);
      }

      listenComponentBackEvent() {
        let event = EventEmitter.addListener('ON_COMPONENT_BACK', event => {
          if (this.props.sceneId === event.sceneId && this.refs.real.onComponentBack) {
            this.refs.real.onComponentBack();
          }
        });
        this.events.push(event);
      }

      componentDidMount() {
        // console.debug('componentDidMount    = ' + this.props.sceneId);
        this.listenComponentResultEvent();
        this.listenBarButtonItemClickEvent();
        this.listenComponentResumeEvent();
        this.listenComponentPauseEvent();
        this.listenDialogBackPressedEvent();
        this.listenComponentBackEvent();
        this.navigator.signalFirstRenderComplete();
      }

      componentWillUnmount() {
        // console.debug('componentWillUnmount = ' + this.props.sceneId);
        navigators.delete(this.props.sceneId);
        this.events.forEach(event => {
          event.remove();
        });
      }

      render() {
        return (
          <RealComponent
            ref="real"
            {...this.props}
            navigation={this.navigator} // 向后兼容
            navigator={this.navigator}
            garden={this.garden}
          />
        );
      }
    }

    let RootComponent;
    Screen.componentName = appKey;
    if (componentWrapperFunc) {
      RootComponent = componentWrapperFunc(() => Screen);
    } else {
      RootComponent = Screen;
    }

    // build static options
    let options = copy(RealComponent.navigationItem);
    if (options.leftBarButtonItem && typeof options.leftBarButtonItem.action === 'function') {
      options.leftBarButtonItem.action = 'left_bar_button_item_click';
    }

    if (options.rightBarButtonItem && typeof options.rightBarButtonItem.action === 'function') {
      options.rightBarButtonItem.action = 'right_bar_button_item_click';
    }

    if (options.leftBarButtonItems) {
      let items = options.leftBarButtonItems;
      for (let i = 0; i < items.length; i++) {
        let item = items[i];
        if (typeof item.action === 'function') {
          item.action = 'left_bar_button_item_click_' + i;
        }
      }
    }

    if (options.rightBarButtonItems) {
      let items = options.rightBarButtonItems;
      for (let i = 0; i < items.length; i++) {
        let item = items[i];
        if (typeof item.action === 'function') {
          item.action = 'right_bar_button_item_click_' + i;
        }
      }
    }

    // console.info('register component:' + appKey + ' options:' + JSON.stringify(options));

    AppRegistry.registerComponent(appKey, () => RootComponent);
    NavigationModule.registerReactComponent(appKey, options);
  },
};
