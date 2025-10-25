# Deployment Diagram

```mermaid
graph TB
  Browser((Browser))
  Nginx[Nginx]
  FE[Frontend (Static)]
  API[Flask API]
  DB[(Postgres)]
  Browser-->Nginx
  Nginx-->FE
  Nginx-->API
  API-->DB
```

Export to docs/diagrams/deployment.png
