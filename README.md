# TP1-Service-Web

## UML Diagrams

### Class Diagram
---

### Entity Relationship Diagram

---

## AniList API Documentation
https://docs.anilist.co/guide/graphql/

There is a playground and visualization section. We can see all the queries and mutations available in the API. The documentation also provides examples of how to use the API with different programming languages.

---

## Difficulties Encountered
### Jean-Simon
- Understanding the GraphQL versus REST API concepts.
> The query is the list of fields that we want to extract from the API.

Exemple of a query to get an anime by its ID:
````TypeScript
const getAnimeByIdQuery = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      format
    }
  }
`;
````
We just have hade to add the query to the body of the request and send it to the API.

The search parameters inside the query are called variables. We can use them to filter the results of the query.

Took me some time to be able to refine the API fil. I had to understand how to use the query variables and how to structure the query to get the desired results.

## Link for the query list
https://docs.anilist.co/reference/query