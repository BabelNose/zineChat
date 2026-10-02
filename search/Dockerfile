# Pin the Meilisearch version so builds are reproducible
ARG MEILISEARCH_VERSION=v1.10

# Use the official Meilisearch image as the base image
FROM getmeili/meilisearch:${MEILISEARCH_VERSION}

# Directory where Meilisearch persists its index data
WORKDIR /meili_data

# Disable anonymous usage analytics
ENV MEILI_NO_ANALYTICS=true

# Expose the Meilisearch HTTP API port
EXPOSE 7700

# Command to run the Meilisearch instance
CMD ["meilisearch"]
