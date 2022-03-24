const supertest = require('supertest');
const app = require('./app');
const Matkaaja = require('./models/matkaaja');

let accessToken;
const oldAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMzYxMWRjYTVjZTlhYjdiMGUzYTZmZiIsInNwb3N0aSI6Im1hcmVrLnB1dXJ1bmVuQGdtYWlsLmNvbSIsImlhdCI6MTY0Nzc2NDU1MywiZXhwIjoxNjQ3NzY0NTYzfQ.SP3CvmkB4W-hhy7YTvgaTQxZij6mdKhLX_BzkpCpK8E';

let sposti = 'marpuu@gmail.com';
const salasana = 'aaaaaa';
const nimimerkki = 'testi123456789';

const user = {
  etunimi: 'Eero',
  sukunimi: 'Niskanen',
  nimimerkki: 'EeroNis',
  esittely: 'Joku esittely',
  paikkakunta: 'kuopio',
  sposti: 'eeropokoniskanentest@gmail.com',
};

// <----------------------------------------->
// /api/user/register
// <----------------------------------------->

describe('POST /api/user/register', function () {
  it('Virhe: Rekisteröidy ilman salasanaa ja virheellisellä spostilla', async () => {
    const response = await supertest(app)
      .post('/api/user/register')
      .send({
        etunimi: 'marek',
        sukunimi: 'puurunen',
        nimimerkki: nimimerkki,
        paikkakunta: 'kuopio',
        sposti: 'Marek.puurunengmail.com',
      })
      .set('Accept', 'application/json');
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(400);
    expect(response.body.message[0]['param']).toEqual('sposti');
    expect(response.body.message[1]['param']).toEqual('salasana');
  });

  it('Rekisteröidy onnistuneesti', async () => {
    const response = await supertest(app)
      .post('/api/user/register')
      .send({
        etunimi: 'marek',
        sukunimi: 'puurunen',
        nimimerkki: nimimerkki,
        paikkakunta: 'kuopio',
        sposti,
        salasana,
      })
      .set('Accept', 'application/json');
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(201);
    expect(response.body.message).toEqual('OK');
  });
  it('Virhe: Rekisteröidy sposti jo käytössä', async () => {
    const response = await supertest(app)
      .post('/api/user/register')
      .send({
        etunimi: 'marek',
        sukunimi: 'puurunen',
        nimimerkki: nimimerkki + '0',
        paikkakunta: 'kuopio',
        sposti,
        salasana,
      })
      .set('Accept', 'application/json');
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(400);
    expect(response.body.message).toEqual(['Sposti on jo käytössä']);
  });
  it('Testaa regex nimimerkillä', async () => {
    //Annetaan sama nimimerkki pienellä => vastaus pitäisi olla että nimimerkki on jo käytössä

    const response = await supertest(app)
      .post('/api/user/register')
      .send({
        etunimi: 'marek',
        sukunimi: 'puurunen',
        nimimerkki: nimimerkki,
        paikkakunta: 'kuopio',
        sposti: 'test123634@gmail.com',
        salasana,
      })
      .set('Accept', 'application/json');
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(400);
    expect(response.body.message).toEqual(['nimimerkki on jo käytössä']);
  });
});

// <----------------------------------------->
// /api/user/login
// <----------------------------------------->

describe('POST /api/user/login', function () {
  it('Virhe: Kirjaudu sisään väärä salasana', async () => {
    const response = await supertest(app)
      .post('/api/user/login')
      .send({ sposti, salasana: 'aaaaa' })
      .set('Accept', 'application/json');
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(400);
    expect(response.body.message).toEqual(
      'Sposti tai salasana on virheellinen'
    );
  });
  it('Virhe: Kirjaudu sisään ei spostia syötetty', async () => {
    const response = await supertest(app)
      .post('/api/user/login')
      .send({ salasana })
      .set('Accept', 'application/json');
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(400);
    expect(response.body.message).toEqual('Params puuttuu');
  });

  it('Kirjaudu sisään Onnistuneesti', async () => {
    const response = await supertest(app)
      .post('/api/user/login')
      .send({ sposti, salasana })
      .set('Accept', 'application/json');
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(200);
    accessToken = response.body.accessToken;
  });
});

// <----------------------------------------->
// Require auth
// <----------------------------------------->

describe('RequireAuth Testi', function () {
  it('Token toimii', async () => {
    const response = await supertest(app)
      .get('/privateRoute')
      .send()
      .set('Accept', 'application/json')
      .auth(accessToken, { type: 'bearer' });
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(200);
  });
  it('Virhe: Vanha token/epäkelpo token', async () => {
    const response = await supertest(app)
      .get('/privateRoute')
      .send()
      .set('Accept', 'application/json')
      .auth(oldAccessToken, { type: 'bearer' });
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(403);
  });
  it('Virhe: Ei tokenia', async () => {
    const response = await supertest(app)
      .get('/privateRoute')
      .send()
      .set('Accept', 'application/json');
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(401);
  });
});
// <----------------------------------------->
// /api/user/editprofile
// <----------------------------------------->

describe('PUT /api/user/editprofile', function () {
  it('Virhe: muokattu sposti on jo käytössä', async () => {
    const response = await supertest(app)
      .put('/api/user/editprofile')
      .send({ ...user, sposti: 'Marek.puurunen@gmail.com' })
      .set('Accept', 'application/json')
      .auth(accessToken, { type: 'bearer' });
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(400);
    expect(response.body.message).toEqual('Sposti on jo käytössä');
  });
  it('Muokkaa tietoja onnistuneesti', async () => {
    const response = await supertest(app)
      .put('/api/user/editprofile')
      .send({ ...user })
      .set('Accept', 'application/json')
      .auth(accessToken, { type: 'bearer' });
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(200);

    expect(response.body.user.sposti).toEqual(user.sposti);
    expect(response.body.user.paikkakunta).toEqual(user.paikkakunta);
    expect(response.body.user.etunimi).toEqual(user.etunimi);
    expect(response.body.user.sukunimi).toEqual(user.sukunimi);
    expect(response.body.user.esittely).toEqual(user.esittely);
  });
});

// <----------------------------------------->
// /api/user/changepassword
// <----------------------------------------->

describe('PUT Vaihda salasana', function () {
  it('Virhe: liian lyhyt salasana', async () => {
    const response = await supertest(app)
      .put('/api/user/changepassword')
      .send({ salasana: 'aaaa', uusiSalasana: 'bbbb' })
      .set('Accept', 'application/json')
      .auth(accessToken, { type: 'bearer' });
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(400);
    expect(response.body.message).toEqual(
      'Salasanan täytyy olla 5-15 merkkiä pitkä'
    );
  });
  it('Virhe: väärä salasana', async () => {
    const response = await supertest(app)
      .put('/api/user/changepassword')
      .send({ salasana: 'bbbbbbb', uusiSalasana: 'aaaaaa' })
      .set('Accept', 'application/json')
      .auth(accessToken, { type: 'bearer' });
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(400);
    expect(response.body.message).toEqual('Salasana on virheellinen');
  });
  it('Vaihda salasana', async () => {
    const response = await supertest(app)
      .put('/api/user/changepassword')
      .send({ salasana: 'aaaaaa', uusiSalasana: 'bbbbb' })
      .set('Accept', 'application/json')
      .auth(accessToken, { type: 'bearer' });
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.status).toEqual(200);
  });
});

describe('DELETE Poista tehdyt muutokset', function () {
  it('Poista luotu käyttäjä', async () => {
    const response = await Matkaaja.findOneAndDelete({
      sposti: user.sposti,
    }).exec();
    expect(response.sposti).toEqual(user.sposti);
  });
});
