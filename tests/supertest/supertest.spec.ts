import express from 'express';
import { expectTypeOf } from 'expect-type';
import { requestSender } from '../../src/supertest/supertest';
import { paths, operations } from './types';

describe('requestSender', () => {
  let expressApp: express.Application;

  beforeEach(function () {
    expressApp = express();
  });

  it('should send a simple request with no parameters', async () => {
    expect.assertions(3);
    expressApp.get('/simple-request', (req, res) => {
      expect(req.query).toEqual({});
      // eslint-disable-next-line @typescript-eslint/naming-convention
      expect(req.headers).toEqual(expect.objectContaining({ 'content-type': 'application/json' }));
      expect(req.params).toEqual({});
      res.json({ message: 'Hello, World!' });
    });
    const r = await requestSender<{ paths: paths; operations: operations }>('tests/supertest/openapi3.yaml', expressApp);

    const res = await r.simpleRequest();

    expectTypeOf(res.body).toEqualTypeOf<operations['simpleRequest']['responses']['200']['content']['application/json']>();
    expectTypeOf<typeof r.simpleRequest>().parameter(0).toMatchTypeOf<object | undefined>();
    expectTypeOf<typeof r.simpleRequest>().parameter(1).toBeUndefined();
  });

  it('should add query parameters to the request even when none are stated in the openapi', async () => {
    expect.assertions(1);
    expressApp.get('/simple-request', (req, res) => {
      expect(req.query).toEqual({ name: 'John' });

      res.json({ message: 'Hello, World!' });
    });
    const r = await requestSender<{ paths: paths; operations: operations }>('tests/supertest/openapi3.yaml', expressApp);

    await r.simpleRequest({ queryParams: { name: 'John' } });
  });

  it('should require query parameters when they are stated as required in the openapi', async () => {
    expect.assertions(1);
    expressApp.get('/request-with-required-query-parameters', (req, res) => {
      expect(req.query).toEqual({ name: 'John' });

      res.json({ message: 'Hello, World!' });
    });
    const r = await requestSender<{ paths: paths; operations: operations }>('tests/supertest/openapi3.yaml', expressApp);

    await r.requestWithRequiredQueryParameters({ queryParams: { name: 'John' } });
    expectTypeOf<Parameters<typeof r.requestWithRequiredQueryParameters>[0]['queryParams']>().not.toBeUndefined();
  });
});
