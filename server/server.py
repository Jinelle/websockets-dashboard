#!/usr/bin/env python
#
# Copyright 2009 Facebook
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.
"""Simplified chat demo for websockets.

Authentication, error handling, etc are left as an exercise for the reader :)
"""

import logging
import tornado.escape
import tornado.ioloop
import tornado.options
import tornado.template
import tornado.web
import tornado.websocket
import os.path
import uuid
import glob

from tornado.options import define, options

root_dir = os.path.dirname(os.path.dirname(__file__))

# Load config
import ConfigParser
cp = ConfigParser.ConfigParser()
cp.read(os.path.join(root_dir, 'config.ini'))
default_port = cp.get('general', 'port')
host = cp.get('general', 'host')

define("port", default=default_port, help="run on the given port", type=int)

class Application(tornado.web.Application):
    def __init__(self):

        plugins_path = os.path.join(root_dir, "enabled-plugins")

        handlers = [
            (r"/", MainHandler),
            (r"/chatsocket", ClientSocketHandler),
            (r"/plugin/(.*)", PluginClientHandler, {"path": plugins_path}),
            (r"/update/(.*)", UpdateHandler)
        ]

        settings = dict(
            cookie_secret = "43oETzKXQAGaYdkL5gEmGeJJFuYh7EQnp2XdTP1o/Vo=",
            template_path = os.path.join(root_dir, "server", "templates"),
            static_path   = os.path.join(root_dir, "server", "static"),
            xsrf_cookies  = False,
            autoescape    = None,
        )
        tornado.web.Application.__init__(self, handlers, **settings)


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        url = 'http://%s:%s' % (host, options.port)
        self.render("index.html", messages=ClientSocketHandler.cache, plugin_clients=plugin_clients, url=url)


class PluginClientHandler(tornado.web.StaticFileHandler):
    def parse_url_path(self, url_path):
        path = url_path.split('/')
        return '%s/static/%s' % (path[0], path[1])


class UpdateHandler(tornado.web.RequestHandler):
    def post(self, plugin):
        data = self.get_arguments('data')

        items = []
        for item in data:
           ClientSocketHandler.update_cache(plugin, item)

        ClientSocketHandler.send_updates(plugin, data)


class ClientSocketHandler(tornado.websocket.WebSocketHandler):
    clients = set()
    cache = {}
    cache_size = 20

    def allow_draft76(self):
        # for iOS 5.0 Safari
        return True

    def open(self):
        ClientSocketHandler.clients.add(self)
        # Send through any cached data
        ClientSocketHandler.push_cache(self)

    def on_close(self):
        ClientSocketHandler.clients.remove(self)

    @classmethod
    def update_cache(cls, plugin, data):
        if plugin not in cls.cache:
            cls.cache[plugin] = []

        cls.cache[plugin].append(data)
        if len(cls.cache[plugin]) > cls.cache_size:
            cls.cache[plugin] = cls.cache[plugin][-cls.cache_size:]

    @classmethod
    def push_cache(cls, client):
        if not len(cls.cache):
            return

        for plugin in cls.cache:
            if not len(cls.cache[plugin]):
                continue

            message = ClientSocketHandler.generate_message(plugin, cls.cache[plugin])
            try:
                client.write_message(message)
            except:
                logging.error("Error sending message", exc_info=True)

    @classmethod
    def send_updates(cls, plugin, data):
        logging.info("sending message to %d clients", len(cls.clients))
        for client in cls.clients:
            message = ClientSocketHandler.generate_message(plugin, data)
            try:
                client.write_message(message)
            except:
                logging.error("Error sending message", exc_info=True)


    @classmethod
    def generate_message(cls, plugin, data):
        # Check if we are getting multiple data
        if isinstance(data, list):
            data = '['+','.join(data)+']'

        data = {
            "plugin": plugin,
            "body": data
        }

        t = tornado.template.Template('<div class="incoming-data" data-plugin="{{ plugin }}">{{ data }}</div>')
        data['html'] = t.generate(plugin=plugin, data=data["body"])
        return data

    def check_origin(self, origin):
        return 'http://'+host == origin


def get_plugins():
    plugins = []

    plugins_path = os.path.join(root_dir, "enabled-plugins")
    plugin_dirs = os.listdir(plugins_path)
    for plugin in plugin_dirs:
        pluginpath = os.path.join(plugins_path, plugin)
        if not os.path.isdir(pluginpath):
            continue
        plugins.append(plugin)

    return plugins


def get_plugin_staticdir(plugin):
    path = os.path.join(root_dir, "enabled-plugins", plugin, "static")
    if os.path.exists(path) and os.path.isdir(path):
        return path
    else:
        return None


def plugin_clients():
    plugins = get_plugins()

    output = ''
    for plugin in plugins:
        path = get_plugin_staticdir(plugin)
        if path:
            # Include any css files
            for css in glob.glob(os.path.join(path, "*.css")):
                output += '<link rel="stylesheet" href="/plugin/%s/%s" type="text/css"/>\n' % (plugin, os.path.basename(css))

            # Include main plugin js file (other js can be included dynamically from this js file)
            if os.path.exists(os.path.join(path, "client.js")):
                output += '<script src="/plugin/%s/client.js" type="text/javascript"></script>\n' % plugin

    return output


def main():
    tornado.options.parse_command_line()
    app = Application()
    app.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()
