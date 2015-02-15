# cb-bread

Couchbase Browse/Read/Edit/Add/Delete

This application provides a (hopefully) friendly user interface for browsing and editing JSON documents stored in a [Couchbase](http://www.couchbase.com/) NoSQL server.

This application is intended to be run on your local workstation, so you can provide Couchbase server connection options on the command line and monitor the server log messages.

This application can connect to any Couchbase server visible to your workstation's network connect.

### Pre-requisites:

You need a Git source code control client: [Git client downloads](http://git-scm.com/downloads).
Windows users may prefer [PortableGit](https://github.com/msysgit/msysgit/releases/).

You also need Node.js: [Node.js downloads](http://nodejs.org/download/).

### To download cb-bread:

Open a **git-bash** command prompt window, which provides Unix/Linux shell command support.

Navigate to your _home_ folder (or a folder of your choice).

Clone the **cb-bread** project from GitHub, and then navigate to that folder:

    cd ~
    git clone https://github.com/rrutt/cb-bread.git
    cd cb-bread

### To install:

    npm install

### To run:

    node server

Then open [http://localhost:8008/](http://localhost:8008/) in a browser.

If the browser window seems to _hang_ after some operation check the command prompt window for possible error messages.

### To stop the server:

Use **Control-C** once or twice in the command prompt window to stop the Node.js server.

### For command-line options:

    node server --help

You can also view the resulting usage text as [help.txt](https://github.com/rrutt/cb-bread/blob/dev/help.txt)

### Adapted from:

["My DocumentDB" - A Simple Web-based DocumentDB Management Tool](http://blog.shaunxu.me/archive/2014/09/17/quotmy-documentdbquot---a-simple-web-based-documentdb-management-tool.aspx) by Shaun Xu.

[https://github.com/shaunxu/myazdocdb](https://github.com/shaunxu/myazdocdb)
