# Component Diagram

```mermaid
graph LR
  UI[React UI]-->|HTTP| API[Flask Blueprints]
  API-->|calls| Services
  Services-->|ORM| Models
  Models-->|SQL| DB[(Database)]
```

Export to docs/diagrams/component.png
