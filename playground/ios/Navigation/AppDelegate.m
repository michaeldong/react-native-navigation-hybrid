//
//  AppDelegate.m
//  Navigation
//
//  Created by Listen on 2017/11/18.
//  Copyright © 2017年 Listen. All rights reserved.
//

#import "AppDelegate.h"
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <React/RCTLog.h>

#import <NavigationHybrid/NavigationHybrid.h>

#import "NativeNavigationViewController.h"
#import "NativeResultViewController.h"

@interface AppDelegate () <HBDReactBridgeManagerDelegate>

@end

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    
    [HBDReactBridgeManager instance].delegate = self;
    
    NSURL *jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"playground/index" fallbackResource:nil];
    [[HBDReactBridgeManager instance] installWithBundleURL:jsCodeLocation launchOptions:launchOptions];
    
    // 注册 native 模块
    [[HBDReactBridgeManager instance] registerNativeModule:@"NativeNavigation" forController:[NativeNavigationViewController class]];
    [[HBDReactBridgeManager instance] registerNativeModule:@"Navigation" forController:[NativeNavigationViewController class]];
    [[HBDReactBridgeManager instance] registerNativeModule:@"NativeResult" forController:[NativeResultViewController class]];
    
    UIViewController *vc = [[UIStoryboard storyboardWithName:@"LaunchScreen" bundle:[NSBundle mainBundle]] instantiateInitialViewController];
    self.window.rootViewController = vc;
    [self.window makeKeyAndVisible];
    
    return YES;
}

- (void)reactModuleRegistryDidCompleted:(HBDReactBridgeManager *)manager {
    NSLog(@"reactModuleRegistryDidCompleted");
    HBDNavigationController *nav = [[HBDNavigationController alloc] initWithRootModule:@"ReactNavigation" props:nil options:nil];
    self.window.rootViewController = nav;
}


- (void)applicationWillResignActive:(UIApplication *)application {
    // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
    // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
}


- (void)applicationDidEnterBackground:(UIApplication *)application {
    // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
    // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
}


- (void)applicationWillEnterForeground:(UIApplication *)application {
    // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
}


- (void)applicationDidBecomeActive:(UIApplication *)application {
    // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
}


- (void)applicationWillTerminate:(UIApplication *)application {
    // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
}


@end
