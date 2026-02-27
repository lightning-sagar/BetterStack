import { describe, expect, it } from "bun:test";
import axios from "axios";
// will update this in future
let BASE_URL = "http://localhost:5000";
describe("Website get created", () => {
  it("should create a website entry in the database", async () => {
    try {
      const res = await axios.post(`${BASE_URL}/`, {
        url: "https://example.com",
      });
      expect(res.status).toBe(201);
    } catch (err) {
      console.error("Error during test:", err);
        throw err;
    }
  });
});
