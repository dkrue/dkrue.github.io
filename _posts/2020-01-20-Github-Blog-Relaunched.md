---
layout: post
title:  "Github based blog relaunched"
date:   2020-01-20 01:36:39 -0500
categories: jekyll github
---
I've been missing my old Wordpress programming blog, but I no longer have a dedicated server with which to run Wordpress on. Obviously you can set up a free blog but I've been wondering if something like Github could do static site hosting.

Turns out it is true! [Github-Pages] can publish and host static websites, which is perfect for programming related projects and repos.
This post is the result of setting up Git, [Jekyll][jekyll-home], Ruby, and Bundler on my 10 year old iMac.

My interest was initially piqued by this [TeamTreeHouse][teamtreehouse] post talking about hosting a site on on Github with your own domain. Then I was thoroughly convinced by a detailed write-up: [Goodbye WordPress. Hello, Jekyll!][stealthpuppy] by someone in the exact same self-hosted boat I was in.

The [GitHub Pages Help][jekyll-help] has more info on how to get [Jekyll][jekyll-home] working with GitHub.

Local Webserver
===

Since [Jekyll][jekyll-home] is an entirely text-based templating engine running on Ruby, you can preview the compiled website locally before committing and publishing to Github. By running the following command in terminal, the website can be previewed at _http://localhost:4000_

`bundle exec jekyll serve`

[Jekyll][jekyll-home] supports [Markdown][markdown] for formatting text, making it easy to create polished content quickly, like that code formatting above!

If you're curious to see how the files work behind the scenes, check out the [Github repo][this-repo] for this site.

[this-repo]: https://github.com/dkrue/dkrue.github.io
[markdown]: https://en.wikipedia.org/wiki/Markdown
[stealthpuppy]: https://stealthpuppy.com/goodbye-wordpess-hello-jekyll/
[Github-Pages]: https://pages.github.com/
[jekyll-help]: https://help.github.com/en/github/working-with-github-pages/creating-a-github-pages-site-with-jekyll
[jekyll-home]:   https://jekyllrb.com/
[teamtreehouse]: https://blog.teamtreehouse.com/using-github-pages-to-host-your-website
[migrating-wordpress]:  https://akshayranganath.github.io/Migrating-Wordpress-Blogs-to-Github-Pages/