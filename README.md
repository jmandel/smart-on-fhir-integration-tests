## Integration testing for SMART on FHIR
(This is just a quick experiment.)

To try it:

1. Install nodejs >= 0.11 (not 0.10 -- this depends on ES6 "generators"). Recommend using [`nvm`](https://github.com/creationix/nvm) for this.
2. `npm install -g phantomjs`
3. `npm install`
4. `wget http://selenium-release.storage.googleapis.com/2.43/selenium-server-standalone-2.43.1.jar -O selenium-sever.jar`
5. `java -jar selenium-sever.jar &`
6. `npm test`
