/*
 * ewebpack.js
 *
 * A toolkit and utility belt for managing a electron+webpack plugin.
 *
 * Due to infrastructure involved with setting up an electron+webpack
 * project, this tool helps get started quick by providing commands to
 * build, start and distribute electron+webpack applications.
 *
 * commands:
 *
 * init
 * build
 * start
 * dist
 */
const yargs = require("yargs");
const fs = require("fs");
const path = require("path");
const util = require("util");
const _ = require("lodash");
const log = require("./logger");

var ewebpackConfig =
{
  "main": {
    "src": "src/main",
    "webpack-config": "webpack.config.js",
    "webpack-override": false
  },
  "renderer": {
    "src": "src/renderer",
    "webpack-config": "webpack.config.js",
    "webpack-override": false
  }
};

var __before = function(argv)
{
  log.level = argv.verbose ? "debug" : "info";
  log.debug("Starting in verbose mode.");
};

/**
 * Default command
 * @return {[type]} [description]
 */
var defaultCommand = function(argv)
{
  log.warn("You didn't specify a command. Try --help");
};

/**
 * init command
 * @return {[type]} [description]
 */
var init = async function(argv)
{

  log.info(`Initialing Electron + Webpack project.`);
  log.debug(`Provided path: ${argv.path}`);
  log.debug(`Resolved path to ${path.resolve(argv.path)}`);

  var f = path.resolve(argv.path, "ewebpack.json");

  if (fs.existsSync(f))
  {
    log.warn(`ewebpack.json exists (using this configuration): delete this file to start over.`);

    var data = JSON.parse(fs.readFileSync(f, "utf8"));
    log.debug("ewebpack.json data: ", data);
    ewebpackConfig = _.extend(ewebpackConfig, data);
  }
  else
  {
    log.debug(`ewebpack.json does not exist; writing file.`);
    fs.writeFileSync(f, JSON.stringify(ewebpackConfig, {}, 2));
    if (argv.verbose) console.log(`File written`);
  }

  log.debug("Loaded config: ");
  if (argv.verbose) console.log(ewebpackConfig);

  log.debug(`main.src=${ewebpackConfig.main.src}`);

  var paths = [ewebpackConfig.main.src, ewebpackConfig.renderer.src];
  for (p of paths)
  {
    if (!fs.existsSync(path.resolve(argv.path, p)) || argv.force)
    {
      log.info(`Creating directory ${p}`);
      fs.mkdirSync(path.resolve(argv.path, p), {recursive: true});
    }
    else if (argv.path != ".")
    {
      log.error(`${p} already exists; use --force to overwrite.`);
      return;
    }
  }

  log.info(`Writing Electron main process: main.js @ ${ewebpackConfig.main.src}`);
  var mainTemplate = path.resolve(__dirname, "templates", "electron-main.js");
  var mainOutputPath = path.resolve(argv.path, ewebpackConfig.main.src, "main.js");
  if (!fs.existsSync(mainOutputPath) || argv.force)
  {
    fs.writeFileSync(mainOutputPath, fs.readFileSync(mainTemplate, "utf8"));
  }
  else
  {
    log.error("Electron main.js process already exists; use --force to overwrite.");
    return;
  }

  log.info(`Writing Electron renderer process: renderer.js @ ${ewebpackConfig.renderer.src}`);
  var rendererOutputPath = path.resolve(argv.path, ewebpackConfig.renderer.src, "renderer.js");
  if (!fs.existsSync(rendererOutputPath) || argv.force)
  {
    fs.writeFileSync(rendererOutputPath, "");
  }
  else
  {
    log.error("Electron main.js process already exists; use --force to overwrite.");
    return;
  }

  var mainWebpackOutputPath = path.resolve(argv.path, ewebpackConfig.main.src, ewebpackConfig.main["webpack-config"]);
  var rendererWebpackOutputPath = path.resolve(argv.path, ewebpackConfig.renderer.src, ewebpackConfig.renderer["webpack-config"]);
  var mainWebpackTemplate = path.resolve(__dirname, "templates", "main-webpack.config.js");
  var rendererWebpackTemplate = path.resolve(__dirname, "templates", "renderer-webpack.config.js");

  log.info(`Writing webpack.config.js files @ ${ewebpackConfig.main.src} ${ewebpackConfig.renderer.src}`);
  fs.writeFileSync(mainWebpackOutputPath, fs.readFileSync(mainWebpackTemplate, "utf8"));
  fs.writeFileSync(rendererWebpackOutputPath, fs.readFileSync(rendererWebpackTemplate, "utf8"));
};

/**
 * yargBuilder callback; helps setup command args in yargs
 *
 * @param  {[type]} y yargs
 * @return {[builder]}   builder
 */
var _yargInitBuilder = function(y)
{
    y.option("force", {
      alias: "f",
      default: false,
      description: `Override any existing files; initializing the new project
      at the structure specific. Dangerous will overrwrite exsiting data`
    });

    y.positional("path", {
      type: "string",
      default: ".",
      describe: "path or folder to initialize project."
    }).default("path", ".");
};

/*
 * SETUP YARGS CLI interface
 *
 * implement mappings.
 */
yargs

  /*
   * command takes the form
   * ewebpack <cmd> [arguments]
   *
   * e.g, ewebpack init .
   */
  .usage("$0 <cmd> [args]")

  /*
   * DEFINE COMMAND LIST
   * -------------------
   *
   * {default}
   * init, i, initialize [path]
   */
  /*
   * Default command run when no command is given.
   */
  .command("*", "Default command", {}, defaultCommand)

  /*
   * init [path] command
   * alias: i, initialize
   *
   * info:
   */
  .command(
  ["init [path]", "initialize", "i"],
    "Initializes an .ewebpack.json configuration file and electron+webpack project structure",
    _yargInitBuilder, init
  )

  /*
   * Add verbose loggining option
   */
  .option("verbose", {
    description: "Enable verbose logging. ewebpack will output extra log data to help debug issues."
  })

  .middleware([__before])

  .help()
  .argv;
