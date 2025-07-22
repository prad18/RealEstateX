# Gunicorn configuration file

# The socket to bind to.
# '0.0.0.0' makes the server accessible from outside the container
bind = "0.0.0.0:8000"

# The number of worker processes
workers = 2

# The type of worker to use. Uvicorn is needed for FastAPI.
worker_class = "uvicorn.workers.UvicornWorker"

# The maximum number of simultaneous clients
worker_connections = 1000

# The maximum number of requests a worker will process before restarting
max_requests = 2000

# Amount of jitter to add to the max_requests setting
max_requests_jitter = 400

# The number of seconds to wait for requests on a Keep-Alive connection
keepalive = 5

# Timeout for workers
timeout = 120