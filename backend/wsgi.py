"""
Compatibility entrypoint for deployments that import the application object.

Runtime secrets must be supplied through environment variables by the hosting
platform. This module intentionally contains no database credentials.
"""

from api.index import app

application = app
