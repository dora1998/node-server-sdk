import { User } from '../bootstrap';
import https from 'https';
import { Event } from '../objects/event';
import { SourceId } from '../objects/sourceId';
import { GetEvaluationRequest, RegisterEventsRequest } from '../objects/request';
import { GetEvaluationResponse, RegisterEventsResponse } from '../objects/response';

const scheme = 'https://';
const evaluationAPI = '/get_evaluation';
const eventsAPI = '/register_events';

export class Client {
  private readonly host: string;
  private readonly apiKey: string;

  constructor(host: string, apiKey: string) {
    this.host = host;
    this.apiKey = apiKey;
  }

  getEvaluation(
    tag: string,
    user: User,
    featureId: string,
  ): Promise<[GetEvaluationResponse, number]> {
    const req: GetEvaluationRequest = {
      tag,
      user,
      featureId,
      sourceId: SourceId.NODE_SERVER,
    };
    const chunk = JSON.stringify(req);
    const url = scheme.concat(this.host, evaluationAPI);
    return new Promise((resolve, reject) => {
      this.postRequest(url, chunk)
        .then(([res, size]) => {
          try {
            const msg = JSON.parse(res) as GetEvaluationResponse;
            resolve([msg, size]);
          } catch (error) {
            reject(error);
          }
        })
        .catch((err) => {
          return reject(err);
        });
    });
  }

  registerEvents(events: Array<Event>): Promise<[RegisterEventsResponse, number]> {
    const req: RegisterEventsRequest = {
      events,
    };
    const chunk = JSON.stringify(req);
    const url = scheme.concat(this.host, eventsAPI);
    return new Promise((resolve, reject) => {
      this.postRequest(url, chunk)
        .then(([res, size]) => {
          try {
            const msg = JSON.parse(res) as RegisterEventsResponse;
            resolve([msg, size]);
          } catch (error) {
            reject(error);
          }
        })
        .catch((err) => {
          return reject(err);
        });
    });
  }

  private async postRequest(url: string, chunk: string): Promise<[string, number]> {
    console.log({ url, chunk });
    const opts: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: this.apiKey,
      },
      body: chunk,
    };

    try {
      const res = await fetch(url, opts);

      console.log({ res });
      if (!res.ok) {
        if (res.status != 200) {
          throw new InvalidStatusError(
            `bucketeer/api: send HTTP request failed: ${res.status}`,
            res.status,
          );
        }
      }

      return [await res.text(), Number(res.headers.get('content-length') || 0)];
    } catch (error) {
      console.log({ error });
      throw error;
    }
  }
}

export class InvalidStatusError extends Error {
  readonly code: number | undefined;
  constructor(message: string, code: number | undefined) {
    super(message);
    this.code = code;
  }
}
