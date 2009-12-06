
liberator.plugins.places_query = (function(){
const HS = Cc["@mozilla.org/browser/nav-history-service;1"].getService(Ci.nsINavHistoryService);

const ROOT_FOLER_NAMES= ["toolbar","menu","tags"];

function createQuery(query, option){
  let q = HS.getNewQuery();
  for (let i in query){
    if (i == 'folders' && query[i].length > 0){
      q.setFolders(query[i], query[i].length);
      continue;
    }
    if (query[i] !== null)
      q[i] = query[i];
  }
  let o = HS.getNewQueryOptions();
  self.lastQuery = [q, o];
  let r = HS.executeQuery(q, o);
  let urls = PlacesUtils.getURLsForContainerNode(r.root).map(function(n) n.uri);
  return urls
}
/**
 * @param {String|String[]} aPath
 * @return {Object} folder object
 */
function getBookmarkFoldrByPath(path){
  let folders;
  if (path instanceof Array)
    folders = path;
  else if (typeof path == "string")
    folders = path.split("/");

  let rootFolderName = folders.shift();
  let root;
  switch (rootFolderName){
    case 'toolbar':
    case 'menu':
    case 'tags':
      root = Application.bookmarks[rootFolderName];
      break;
    default:
      return;
  }
  let folder = folders.reduce(function(parentFolder, currentFolderName){
    if (!currentFolderName) return parentFolder;
    let currentFolder = parentFolder.children.filter(function(f) f.type == "folder" && f.title == currentFolderName);
    if (currentFolder.length != 1) throw new Error;
    return currentFolder[0];
  }, root);
  return folder;
}
/**
 * @param {String} aPath
 * @return {Object[]}
 */
function getBookmarkFolderChildrenByPath(aPath){
  if (!aPath){
    return ROOT_FOLER_NAMES.map(function(f) Application.bookmarks[f]);
  }
  let parentFolder = getBookmarkFoldrByPath(aPath);
  if (!parentFolder) return [];
  return parentFolder.children.filter(function(f) f.type == "folder");
}

let completions = {
  bookmarkFolder: function(context, args){
    let filter = context.filter;
    let have = filter.split("/");
    if (have.length == 1) {
      return [f for each(f in ROOT_FOLER_NAMES.map(function(id) [id, Application.bookmarks[id]]))];
    }
    args.completer = have.pop();
    let prefix = have.join("/");
    let folders = getBookmarkFolderChildrenByPath(prefix);
    return [[prefix + "/" + folder.title, folder.title] for ([i, folder] in Iterator(folders))];
  },
};
commands.addUserCommand(['places'], 'Places',
  function(args){
    let q = {};
    if ("-folder" in args)
      q.folders = [getBookmarkFoldrByPath(args["-folder"]).id];

    ["onlyBookmarked","domain"].forEach(function(opt){
      if ("-" + opt in args){
        q[opt] = args["-"+opt];
      }
    });
    if (args[0])
      q.searchTerms = args[0];

    let xml = <ul/>;
    let res = createQuery(q);
    res.forEach(function(r){
      xml += <li>{template.highlightURL(r)}</li>;
    });
    liberator.echo(xml, true);
  },{
    options: [
      [["-folder","-F"], commands.OPTION_STRING, null, completions.bookmarkFolder],
      [["-onlyBookmarked","-ob"], commands.OPTION_NOARG],
      [["-domain","-d"], commands.OPTION_STRING],
    ],
    argCount: "?",
    literal: 0
  },
  true);

let self = {
  tag: function(str){
    let bookmark = Application.bookmarks.tags.children.filter(function(b) b.title == str)[0];
    if (bookmark){
      return createQuery({ folders: [bookmark.id], onlyBookmarked: true, });
    }
  },
  get completions() completions,
  folder: function(path){
    return getBookmarkFoldrByPath(path);
  },
};
return self;
})();
// vim: sw=2 ts=2 et:
