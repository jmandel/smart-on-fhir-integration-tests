// requires node 0.11
// run with: mocha --harmony examples/promise/mocha-harmony.js

/* global describe, it, before , beforeEach, after*/
/* jshint moz: true, evil: true */

require('colors');

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();

var wd;
try {
  wd = require('wd');
} catch( err ) {
  wd = require('../../lib/main');
}

var wrap = wd.Q.async;
var visible = wd.asserters.isDisplayed;

var timeout =  wd.Q.denodeify(function(ms, cb){
  setTimeout(
    function(){
      cb(null, true);
    }, ms);
});


describe("SMART on FHIR Stack", function() {
  this.timeout(120000);
  var browser;
  var start = new Date().getTime();

  function timeLog(str){
    console.log("" + (new Date().getTime()-start) + ": ",
    arguments[0]||"",
    arguments[1]||"",
    arguments[2]||"");
  }

  var waitForMatch = wrap(function*(needle, haystack){
    var done = false;
    do {
      done = (yield  browser.eval(needle)).match(new RegExp(haystack));
    } while (!done);
  });

  var openLastWindow = wrap(function*(){
      var wins = yield browser.windowHandles();
      yield browser.window(wins[wins.length-1]);
  });

  before(wrap(function *() {
    browser = wd.promiseChainRemote();
    // optional extra logging
    browser.on('status', function(info) {
      timeLog(info.yellow);
    });
    browser.on('command', function(eventType, command, response) {
      timeLog(' > ' + eventType.cyan, command, (response || '').grey);
    });
    browser.on('http', function(meth, path, data) {
      timeLog(' > ' + meth.magenta, path, (data || '').grey);
    });
    yield browser.init({browserName:'phantomjs'}).setAsyncScriptTimeout(30000);
  }));

  after(wrap(function*() {
    console.log("Quitting...");
    yield browser.quit();
  }));

  it("should support sign in and app launch", wrap(function *() {

    yield browser.setWindowSize(1280,1024);

    yield browser.get("https://ci.fhir.me");

      yield waitForMatch("document.title", "Log In");

      //yield browser.saveScreenshot();
      //yield browser.title().should.eventually.include('Log In');

      yield browser.elementByCss('#j_username').type('demo');
      yield browser.elementByCss('#j_password').type('demo');
      yield browser.elementByCss('input.btn').click();
      yield browser.title().should.eventually.include('FHIR Starter');

      yield browser // click on the first patient (Daniel Adams)
      .waitForElementByCss('#patient-results td.name > span', visible, 5000)
      .click();

      var launch = yield browser
      .waitForElementByCss('div.caption a', visible, 5000);

      yield launch.text().should.eventually.include('Cardiac Risk');
      yield launch.click();
      
      yield openLastWindow();

      timeLog(yield  browser.eval("document.title"));
      timeLog(yield browser.url());

      yield waitForMatch("document.title", "Cardiology");
      yield browser.saveScreenshot();

      timeLog(yield browser.url());
  }));

  it("Should return an error on invalid launch context", wrap(function *() {
    yield browser.newWindow(
      "https://ci-auth.fhir.me/authorize?"+
      "client_id=fhir_demo&"+
      "response_type=code&"+
      "scope=launch:bad-launch-id&"+
      "redirect_uri=https://ci.fhir.me/apps/fhir-demo/app/");

    yield openLastWindow();
    yield waitForMatch("window.location.href", "invalid_scope");
  }));

});
