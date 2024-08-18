/* eslint-disable @typescript-eslint/naming-convention */
import express from 'express';
import { expectTypeOf } from 'expect-type';
import bodyParser from 'body-parser';
import { RequestSenderObj } from '../../src/supertest/types';
import { requestSender } from '../../src/supertest/supertest';
import { paths, operations } from './types';

describe('requestSender', () => {
  let expressApp: express.Application;
  let r: RequestSenderObj<paths, operations>;

  beforeEach(async function () {
    expressApp = express();
    expressApp.use(bodyParser.json());
    r = await requestSender<{ paths: paths; operations: operations }>('tests/supertest/openapi3.yaml', expressApp);
  });

  describe('operations', () => {
    it('should send a simple request with no parameters', async () => {
      expect.assertions(3);
      expressApp.get('/simple-request', (req, res) => {
        expect(req.query).toEqual({});
        // eslint-disable-next-line @typescript-eslint/naming-convention
        expect(req.headers).toEqual(expect.objectContaining({ 'content-type': 'application/json' }));
        expect(req.params).toEqual({});
        res.json({ message: 'Hello, World!' });
      });
      const res = await r.simpleRequest();

      expectTypeOf(res.body).toEqualTypeOf<operations['simpleRequest']['responses']['200']['content']['application/json']>();
      expectTypeOf(r.simpleRequest).parameter(0).toMatchTypeOf<object | undefined>();
      expectTypeOf(r.simpleRequest).parameter(1).toBeUndefined();
    });

    it('should allow to add headers to the request even when none are required', async () => {
      expect.assertions(1);
      expressApp.get('/simple-request', (req, res) => {
        expect(req.headers).toEqual(expect.objectContaining({ 'x-api-key': '12345' }));

        res.json({ message: 'Hello, World!' });
      });

      await r.simpleRequest({ headers: { 'x-api-key': '12345' } });
    });

    it('should not have a path parameter type when none are stated in the openapi', () => {
      expectTypeOf(r.requestWithRequiredQueryParameters).parameter(0).not.toHaveProperty('pathParams');
    });

    it('should add query parameters to the request even when none are stated in the openapi', async () => {
      expect.assertions(1);
      expressApp.get('/simple-request', (req, res) => {
        expect(req.query).toEqual({ name: 'John' });

        res.json({ message: 'Hello, World!' });
      });

      await r.simpleRequest({ queryParams: { name: 'John' } });
    });

    it('should require query parameters when they are stated as required in the openapi', async () => {
      expect.assertions(1);
      expressApp.get('/request-with-required-query-parameters', (req, res) => {
        expect(req.query).toEqual({ name: 'John' });

        res.json({ message: 'Hello, World!' });
      });

      await r.requestWithRequiredQueryParameters({ queryParams: { name: 'John' } });
      expectTypeOf(r.requestWithRequiredQueryParameters).parameter(0).pick<'queryParams'>().toEqualTypeOf<{ queryParams: { name: string } }>();
    });

    it('should have the entire query parameters object as optional when they are all optional in the openapi', async () => {
      expect.assertions(1);
      expressApp.post('/request-with-optional-query-parameters', (req, res) => {
        expect(req.query).toEqual({ name: 'John' });

        res.json({ message: 'Hello, World!' });
      });

      await r.requestWithOptionalQueryParameters({ queryParams: { name: 'John' } });

      expectTypeOf(r.requestWithOptionalQueryParameters)
        .parameter(0)
        .exclude<undefined>()
        .toHaveProperty('queryParams')
        .toEqualTypeOf<{ name?: string | undefined } | undefined>();
    });

    it('should have the entire query parameters object as required when there are both required and optional params ', async () => {
      expect.assertions(1);
      expressApp.get('/request-with-mixed-query-parameters', (req, res) => {
        expect(req.query).toEqual({ name: 'John' });

        res.json({ message: 'Hello, World!' });
      });

      await r.requestWithMixedQueryParameters({ queryParams: { name: 'John' } });

      expectTypeOf(r.requestWithMixedQueryParameters).parameter(0).toHaveProperty('queryParams').toEqualTypeOf<{ name: string; age?: number }>();
    });

    it('should require path params when any are stated in the openapi', async () => {
      expect.assertions(1);
      expressApp.get('/request-with-path-parameters/John', (req, res) => {
        expect(req.params).toEqual({ name: 'John' });

        res.json({ message: 'Hello, World!' });
      });

      await r.requestWithPathParameters({ pathParams: { name: 'John' } });
      expectTypeOf(r.requestWithPathParameters).parameter(0).toHaveProperty('pathParams').not.toBeUndefined();
    });

    it('should work when the response is empty', async () => {
      expect.assertions(1);
      expressApp.get('/request-with-empty-response', (req, res) => {
        expect(req.query).toEqual({ name: 'John' });
        res.sendStatus(204);
      });

      const res = await r.requestWithEmptyResponse();
      expectTypeOf(res).toHaveProperty('body').toBeNever();
    });

    it.only('should work when the request has all types of parameters', async () => {
      expect.assertions(5);
      expressApp.post('/request-with-all/John', (req, res) => {
        expect(req.params).toEqual({ name: 'John' });
        expect(req.query).toEqual({ first: 'John' });
        expect(req.body).toEqual({ message: 'Hello, World!' });
        expect(req.headers).toEqual(expect.objectContaining({ second: 123 }));

        res.status(201).json({ message: 'Hello, World!' });
      });

      const res = await r.requestWithAll({
        pathParams: { name: 'John' },
        queryParams: { first: 'John' },
        requestBody: { message: 'Hello, World!' },
        headers: { second: '123' },
      });
      expect(res).toHaveProperty('body', { message: 'Hello, World!' });
      expectTypeOf(res).toHaveProperty('body').toEqualTypeOf<{ message?: string }>();
    });

    it('should work when making a post request with 201 response', async () => {
      expect.assertions(3);
      expressApp.post('/post-request', (req, res) => {
        expect(req.body).toEqual({ message: 'Hello, World!' });

        res.status(201).json({ message: 'Created' });
      });

      const res = await r.postRequest({ requestBody: { message: 'Hello, World!' } });
      expect(res).toHaveProperty('body', { message: 'Created' });
      expect(res).toHaveProperty('status', 201);
    });

    it('should work when there are multiple operations with the same path', async () => {
      expect.assertions(2);
      expressApp.get('/endpoint-with-multiple-methods', (req, res) => {
        expect(req.query).toEqual({ test: 'get' });
        res.json({ message: 'Hello get!' });
      });
      expressApp.post('/endpoint-with-multiple-methods', (req, res) => {
        expect(req.query).toEqual({ test: 'post' });
        res.status(201).json({ message: 'Hello post!' });
      });

      const resGet = await r.endpointWithMultipleMethodsGet({ queryParams: { test: 'get' } });
      expect(resGet).toHaveProperty('body', { message: 'Hello get!' });
      expectTypeOf(r.endpointWithMultipleMethodsGet)
        .parameter(0)
        .exclude(undefined)
        .toHaveProperty('queryParams')
        .toEqualTypeOf<{ test?: string } | undefined>();

      const resPost = await r.endpointWithMultipleMethodsPost({ queryParams: { test: 'get' } });
      expect(resPost).toHaveProperty('body', { message: 'Hello post!' });
    });

    it('should work when there are multiple possible responses', async () => {
      expressApp.get('/multiple-status-codes', (req, res) => {
        res.json({ message: 'Hello, World!' });
      });

      const res = await r.multipleStatusCodes();

      if (res.status === 200) {
        expectTypeOf(res.body).toEqualTypeOf<operations['multipleStatusCodes']['responses']['200']['content']['application/json']>();
      } else if (res.status === 201) {
        res.body;
        expectTypeOf(res.body).toEqualTypeOf<operations['multipleStatusCodes']['responses']['201']['content']['application/json']>();
      }
    });

    it('should let you compare status to any number but then body is not typed', async () => {
      expressApp.get('/simple-request', (req, res) => {
        res.json({ message: 'Hello, World!' });
      });

      const res = await r.simpleRequest();
      if (res.status === 503) {
        expectTypeOf(res.body).toBeAny();
      }
    });
  });
});

type C = { status: 200; lol: 'xd' } | { status: 201; lol: 'y' };

type D = C | { status: number & {} };

type E = D['status'];

const a: E = 300;
