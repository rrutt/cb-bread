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

### To stop the cb-bread server:

Use **Control-C** once or twice in the command prompt window to stop the Node.js server.

### For command-line options:

    node server --help

You can also view the resulting usage text as [help.txt](https://github.com/rrutt/cb-bread/blob/dev/help.txt)

### Adapted from:

["My DocumentDB" - A Simple Web-based DocumentDB Management Tool](http://blog.shaunxu.me/archive/2014/09/17/quotmy-documentdbquot---a-simple-web-based-documentdb-management-tool.aspx) by Shaun Xu.

[https://github.com/shaunxu/myazdocdb](https://github.com/shaunxu/myazdocdb)

## Installing a local Couchbase server for development and testing

### Workstation requirements:

Your workstation must have at least 4 CPU cores.

Supported operating systems are Windows, Ubuntu 12.04, Red Hat 6, Mac OSX, Debian 7.

Windows supports both 32-bit and 64-bit mode.
The other operating systems require 64-bit.

### Download the free Community Edition:

Download the appropriate installer for your workstation operating system from [http://www.couchbase.com/nosql-databases/downloads](http://www.couchbase.com/nosql-databases/downloads)

Note that the latest version is legally restricted to Enterprise license customers.
The free Community Edition is available for the prior point release by following the **"< VERSION 3.0.1"** link.

### Install the Couchbase Server:

The download page includes instructions for each operating system.

The installer asks for an Administrator user name and password.
If you are installing for development use only, consider replacing the default user "Administrator" with a shorter name to type such as "admin".

The minimum password length is 6 characters, so for a development-only installion, consider a very-weak-but-convenient value like "demo01".

### Notes for installation on Windows:

The default installation folder is **C:\Program Files\Couchbase**

By default the data files are stored underneath that folder.
If you have several disk volumes mounted, consider installing Couchbase on a drive other than **C:**, especially if your **C:** disk space is limited.

For example, on one of my workstations, I installed to **E:\Couchbase**

The installer creates a Windows Service named "**CouchbaseServer**" which is configured for Startup Type **Automatic**.
This service performs periodic maintenance tasks that can affect performance of other processes on the workstation.

If you only occasionally need to work with your local Couchbase, consider changing the Startup Type to **Manual** and stop the service until you need to use your local Couchbase.

During installation you are given the option to include two sample buckets with test documents already loaded.
If your workstation does not have a copy of Python installed, these sample buckets may be created but will not contain any documents.

(See [Couchbase issue MB-6606](https://issues.couchbase.com/browse/MB-6606).
The installer tries to spawn a Python script to load the documents into the sample buckets.)

If this occurs, you can load the sample bucket documents manually.
Using my example installation folder **E:\Couchbase** here are the commands to load the sample documents from a Windows command prompt:

    cd /d E:\Couchbase\Server\samples
    ..\bin\cbdocloader.exe -u admin -p demo01 -n localhost:8091 -b beer-sample -s 100 beer-sample.zip
    ..\bin\cbdocloader.exe -u admin -p demo01 -n localhost:8091 -b gamesim-sample -s 100 gamesim-sample.zip
    
Substitute your actual Administrator user and password values for "**-u admin -p demo01**".
