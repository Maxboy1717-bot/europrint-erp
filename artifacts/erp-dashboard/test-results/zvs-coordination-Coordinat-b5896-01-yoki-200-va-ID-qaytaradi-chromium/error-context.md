# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: zvs-coordination.spec.ts >> Coordination API — autentifikatsiyalangan >> rasporyazhenie yaratish → 201 yoki 200 va ID qaytaradi
- Location: e2e\zvs-coordination.spec.ts:164:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 401
Received array: [200, 201]
```

# Test source

```ts
  76  | 
  77  |   test("Level-3 ZVS ariza yuborish (>5M) → level=3 qaytaradi", async ({ request }) => {
  78  |     const token = await getAdminToken(request);
  79  |     const res = await request.post(`${API_BASE}/api/hr/zvs`, {
  80  |       headers: { Authorization: `Bearer ${token}` },
  81  |       data: {
  82  |         purpose: "E2E test ZVS level-3",
  83  |         amount: 10_000_000,
  84  |         priority: "critical",
  85  |       },
  86  |     });
  87  |     expect([200, 201]).toContain(res.status());
  88  |     const body = await res.json();
  89  |     expect(body.level).toBe(3);
  90  |   });
  91  | 
  92  |   test("FP cycle → 200 va haftalik holat ma'lumotlari", async ({ request }) => {
  93  |     const token = await getAdminToken(request);
  94  |     const res = await request.get(`${API_BASE}/api/hr/fp-cycle`, {
  95  |       headers: { Authorization: `Bearer ${token}` },
  96  |     });
  97  |     expect(res.status()).toBe(200);
  98  |     const body = await res.json();
  99  |     expect(body).toHaveProperty("today");
  100 |     expect(body).toHaveProperty("weekStart");
  101 |   });
  102 | });
  103 | 
  104 | test.describe("Coordination API — autentifikatsiyasiz", () => {
  105 |   test("coordination councils endpoint 401 qaytaradi", async ({ request }) => {
  106 |     const res = await request.get(`${API_BASE}/api/coordination/councils`);
  107 |     expect([401, 403]).toContain(res.status());
  108 |   });
  109 | 
  110 |   test("dokla endpoint 401 qaytaradi", async ({ request }) => {
  111 |     const res = await request.get(`${API_BASE}/api/coordination/dokla`);
  112 |     expect([401, 403]).toContain(res.status());
  113 |   });
  114 | 
  115 |   test("rasporyazhenie endpoint 401 qaytaradi", async ({ request }) => {
  116 |     const res = await request.get(`${API_BASE}/api/coordination/rasporyazhenie`);
  117 |     expect([401, 403]).toContain(res.status());
  118 |   });
  119 | });
  120 | 
  121 | test.describe("Coordination API — autentifikatsiyalangan", () => {
  122 |   test("councils tuzilmasi → 200 va 5 ta kengash", async ({ request }) => {
  123 |     const token = await getAdminToken(request);
  124 |     const res = await request.get(`${API_BASE}/api/coordination/councils`, {
  125 |       headers: { Authorization: `Bearer ${token}` },
  126 |     });
  127 |     expect(res.status()).toBe(200);
  128 |     const body = await res.json();
  129 |     expect(Array.isArray(body)).toBe(true);
  130 |     expect(body.length).toBe(5);
  131 |     const levels = body.map((c: { level: number }) => c.level).sort();
  132 |     expect(levels).toEqual([1, 2, 3, 4, 5]);
  133 |   });
  134 | 
  135 |   test("dokla yaratish → 201 yoki 200 va ID qaytaradi", async ({ request }) => {
  136 |     const token = await getAdminToken(request);
  137 |     const res = await request.post(`${API_BASE}/api/coordination/dokla`, {
  138 |       headers: { Authorization: `Bearer ${token}` },
  139 |       data: {
  140 |         subject: "E2E Test Доклад",
  141 |         problem: "Muammo tavsifi",
  142 |         result: "Natija",
  143 |         council_level: 3,
  144 |         from_name: "Test Admin",
  145 |       },
  146 |     });
  147 |     expect([200, 201]).toContain(res.status());
  148 |     const body = await res.json();
  149 |     expect(body).toHaveProperty("id");
  150 |     expect(body).toHaveProperty("subject");
  151 |     expect(body.subject).toContain("E2E Test");
  152 |   });
  153 | 
  154 |   test("doklalar ro'yxati → 200 va array", async ({ request }) => {
  155 |     const token = await getAdminToken(request);
  156 |     const res = await request.get(`${API_BASE}/api/coordination/dokla`, {
  157 |       headers: { Authorization: `Bearer ${token}` },
  158 |     });
  159 |     expect(res.status()).toBe(200);
  160 |     const body = await res.json();
  161 |     expect(Array.isArray(body)).toBe(true);
  162 |   });
  163 | 
  164 |   test("rasporyazhenie yaratish → 201 yoki 200 va ID qaytaradi", async ({ request }) => {
  165 |     const token = await getAdminToken(request);
  166 |     const res = await request.post(`${API_BASE}/api/coordination/rasporyazhenie`, {
  167 |       headers: { Authorization: `Bearer ${token}` },
  168 |       data: {
  169 |         task: "E2E Test vazifasi",
  170 |         to_user: "Test Xodim",
  171 |         priority: "medium",
  172 |         deadline: "2026-04-30",
  173 |         from_name: "Test Admin",
  174 |       },
  175 |     });
> 176 |     expect([200, 201]).toContain(res.status());
      |                        ^ Error: expect(received).toContain(expected) // indexOf
  177 |     const body = await res.json();
  178 |     expect(body).toHaveProperty("id");
  179 |     expect(body).toHaveProperty("task");
  180 |   });
  181 | 
  182 |   test("rasporyazhenilar ro'yxati → 200 va array", async ({ request }) => {
  183 |     const token = await getAdminToken(request);
  184 |     const res = await request.get(`${API_BASE}/api/coordination/rasporyazhenie`, {
  185 |       headers: { Authorization: `Bearer ${token}` },
  186 |     });
  187 |     expect(res.status()).toBe(200);
  188 |     const body = await res.json();
  189 |     expect(Array.isArray(body)).toBe(true);
  190 |   });
  191 | });
  192 | 
```