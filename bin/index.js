#! /usr/bin/env node
var vorpal = require("vorpal");
var v = vorpal();
var inq = require("inquirer");
var json = require("json-format");
var fb = require("firebase");
// var torrent = require('create-torrent');
// var magnetLink = require('magnet-link');
var fs = require('fs-extra')
function removeMD (md, options) {
  options = options || {};
  options.stripListLeaders = options.hasOwnProperty('stripListLeaders') ? options.stripListLeaders : true;
  options.gfm = options.hasOwnProperty('gfm') ? options.gfm : true;

  var output = md;
  try {
    if (options.stripListLeaders) {
      output = output.replace(/^([\s\t]*)([\*\-\+]|\d\.)\s+/gm, '$1');
    }
    if (options.gfm){
      output = output
        // Header
        .replace(/\n={2,}/g, '\n')
        // Strikethrough
        .replace(/~~/g, '')
        // Fenced codeblocks
        .replace(/`{3}.*\n/g, '');
    }
    output = output
      // Remove HTML tags
      .replace(/<(.*?)>/g, '$1')
      // Remove setext-style headers
      .replace(/^[=\-]{2,}\s*$/g, '')
      // Remove footnotes?
      .replace(/\[\^.+?\](\: .*?$)?/g, '')
      .replace(/\s{0,2}\[.*?\]: .*?$/g, '')
      // Remove images
      .replace(/\!\[.*?\][\[\(].*?[\]\)]/g, '')
      // Remove inline links
      .replace(/\[(.*?)\][\[\(].*?[\]\)]/g, '$1')
      // Remove Blockquotes
      .replace(/>/g, '')
      // Remove reference-style links?
      .replace(/^\s{1,2}\[(.*?)\]: (\S+)( ".*?")?\s*$/g, '')
      // Remove atx-style headers
      .replace(/^\#{1,6}\s*([^#]*)\s*(\#{1,6})?/gm, '$1')
      .replace(/([\*_]{1,3})(\S.*?\S)\1/g, '$2')
      .replace(/(`{3,})(.*?)\1/gm, '$2')
      .replace(/^-{3,}\s*$/g, '')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\n{2,}/g, '\n\n');
  } catch(e) {
    console.error(e);
    return md;
  }
  return output;
}
const DIR = process.cwd();
const SMPL_DIR = __dirname.replace("\\spc\\bin","\\smpl\\modules");
const CONFIG = JSON.parse(fs.readFileSync(__dirname+"\\config.json","utf8"));
const SPC_CLIENT = `https://spcbase.firebaseio.com`;
var ref = new Firebase(SPC_CLIENT);
if(CONFIG.author){
    const USER_CLIENT = SPC_CLIENT+ CONFIG.author;
}
process.on('SIGINT', function (){ process.exit(2) });

v.command("publish", "Installs a SMPL package to your global directory")
    .alias("p")
    .action(function(a,cb){
        var dir = __dirname .replace("\\spc\\bin","\\smpl\\modules");
        var package_json = JSON.parse(fs.readFileSync(DIR+"\\smpl.json","utf8"));
        ref.authWithPassword({
          email    : CONFIG.email,
          password : CONFIG.password
        }, function(error, authData) {
          if (error) {
            console.log("Login Failed!", error);
          } else {
            console.log("Logged In successfully");
            package_json.package = fs.readFileSync(DIR+"\\"+package_json.main,"utf8");
            if(package_json.description){
                package_json.readme = fs.readFileSync(DIR+"\\"+package_json.description,"utf8");
                console.log(DIR+"\\"+package_json.description);
                // console.log(package_json.readme)
                package_json.shortDescription = package_json.short_description || removeMD(package_json.readme).slice(0,250);
            }
            console.log("got readme info")
            var package_dir = ref.child("packages").child(package_json.name);
            package_dir.set(package_json, function(){
                ref.child("users")
                .child(authData.uid)
                .child("packages")
                .child(package_json.name)
                .set("http:\/\/futurelink.com", function(){
                    console.log("Uploaded package to SPC server");
                    process.exit();
                });

            });

          }
    });
});
// v.command("package")
//     .alias("pk")
//     .action(function(_,cb){
//         console.log("Packaging module...")
//         var smpl_json = JSON.parse(fs.readFileSync(DIR+"\\smpl.json","utf8"));
//         var package_dir = SMPL_DIR+"\\"+smpl_json.name;
//         var client = new torrent();
//         console.log("Moving file to SMPL home directory...")
// });
v.command("install [package...]")
    .alias("i")
    .action(function(a){
        a.package.forEach(function(v){
            var pack = ref.child("packages").child(v);
            pack.on("value", function(snap){
                var obj = snap.val();
                fs.writeFileSync(SMPL_DIR+"\\"+obj.name+".smpl",obj.package);
                console.log(`Package ${obj.name} installed successfully.`)
            });

        })

    })
    v.command("uninstall [package...]")
        .alias("u")
        .action(function(a){
            a.package.forEach(function(v){
                fs.unlink(SMPL_DIR+"\\"+v+".smpl", function(){
                    console.log(`${v} successfully deleted.`);
                });
            })

        })
v.command("login","Set & save system user credentials to SPC")
    .alias("l")
    .action(function(){
        var prompt = inq.prompt([{
            name: "email",
            message: "Email?",
            validate: function (input){
                var done = this.async();
                var reg = /[A-z0-9-_]+@\w+.\w+/
                var result = input.match(reg);
                if(result) done(null, true);
                else done("You need to provide a valid email address");
            }
        },{
            name: "author",
            message: "Author?",
            validate: function (input){
                var done = this.async();
                var reg = /[A-z0-9-_\s]+/
                var result = input.match(reg);
                if(result) done(null, true);
                else done("You need to provide a valid email address");
            }
        },{
            type: "password",
            name: "password",
            message: "Password?"
        }]);
        prompt.then(function(result){
            ref.authWithPassword({
              email    : result.email,
              password : result.password
          },function(error){
              if(error){
                  console.log(error);
                  return process.exit(1);
              }
              fs.writeFile(__dirname+"\\config.json", json(result), function(err){
                  if(err){
                      console.log(err)
                      process.exit(1);
                  }
                  console.log("Successfully logged into SPC servers.")
                  process.exit();
              })
          })
        })
    })
v.command("add-user")
    .alias("a")
    .action(function(a,cb){
        var prompt = inq.prompt([{
            name: "email",
            message: "Email?",
            validate: function (input){
                var done = this.async();
                var reg = /[A-z0-9-_]+@\w+.\w+/
                var result = input.match(reg);
                if(result) done(null, true);
                else done("You need to provide a valid email address");
            }
        },{
            name: "author",
            message: "Author?",
            validate: function (input){
                var done = this.async();
                var reg = /[A-z0-9-_\s]+/
                var result = input.match(reg);
                if(result) done(null, true);
                else done("You need to provide a valid email address");
            }
        },{
            type: "password",
            name: "password",
            message: "Password?"
        }]);
        prompt.then(function(result){
            // var done = this.async();
            ref.createUser({
              email    :  result.email,
              password :  result.password
            }, function(error, userData) {
              if (error) {
                console.log(error);
                process.exit(1);
              } else {
                CONFIG.email = result.email;
                CONFIG.password = result.password;
                CONFIG.author = result.author;
                delete result.password;
                ref.child("users").child(userData.uid).set(result);
                fs.writeFile(__dirname+"\\config.json", json(CONFIG), function(err){
                    if(err){
                        console.log(err)
                        process.exit(1);
                    }
                    console.log("User credentials have been saved to SPC servers successfully.")
                    process.exit();
                })
              }
            });

        });
        return prompt;
    })
v.parse(process.argv);
