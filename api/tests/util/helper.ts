import { SuperAgentTest } from "supertest";

class Helper {
    async RefreshCSRF(request:SuperAgentTest):Promise<string> {
        const csrfRes = await request.get('/auth').send();
        return csrfRes.body.token;
    }
}
export default Helper