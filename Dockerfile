FROM 219.216.80.32:8000/nginx

COPY ./dist /app
# COPY ./nginx.conf /etc/nginx/nginx.conf

EXPOSE 80