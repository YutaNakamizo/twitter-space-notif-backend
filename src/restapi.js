import express from 'express';
import cors from 'cors';
import validator from 'validator';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.NOTIF_ALLOW_ORIGIN,
  })
);

// Initialize Firebase Admin SDK
const firebase = initializeApp();
const firebaseAuth = getAuth(firebase);

export const launch = () => {
  app.get('/', (req, res) => {
    return res.status(200).send('Hello from Express.js');
  });

  // Verify token
  const requireIdToken = (req, res) => {
    const [ authType, idToken ] = req.get('Authorization').split(' ');

    if(!authType === 'Bearer') {
      return res.status(401).send('Invalid type');
    }

    return firebaseAuth.verifyIdToken(idToken, true).catch(err => {
      return res.status(401).send('Invalid token');
    });
  };
  
  // Test of Firebase Auth
  app.post('/api/debug-with-token', (req, res) => {
    return requireIdToken(req, res).then(decodedToken => {
      return res.status(200).send('Hello from Express.js with Firebase Auth Token!');
    });
  });


  // Endpoint
  //// Register
  app.post('/api/endpoints', (req, res) => {
    const {
      label,
      dest,
      destDetails,
    } = req.body;
    
    if(
      (
        typeof label !== 'string'
        || label.trim() === ''
      ) || (
        typeof dest !== 'string'
      ) || (() => {
        switch(dest) {
          case 'discord-webhook': {
            const {
              url,
            } = destDetails;

            return !(
              validator.isURL(url, {
                require_protocol: true,
                require_valid_protocol: true,
                protocols: [
                  'http',
                  'https',
                ],
                require_host: true,
                require_port: false,
                allow_protocol_relative_urls: false,
                allow_fragments: true,
                allow_query_components: true,
                validate_length: true,
              })
              && url.startsWith('https://discord.com/api/webhooks/')
            );
          }
          case 'json': {
            const {
              method,
              url,
            } = destDetails;

            return !(
              [ 'POST', 'GET' ].includes(method)
              && (
                validator.isURL(url, {
                  require_protocol: true,
                  require_valid_protocol: true,
                  protocols: [
                    'http',
                    'https',
                  ],
                  require_host: true,
                  require_port: false,
                  allow_protocol_relative_urls: false,
                  allow_fragments: true,
                  allow_query_components: true,
                  validate_length: true,
                })
              )
            );
          }
          default:
            return true;
        }
      })()
    ) {
      return res.status(400).send('Bad request body');
    }

    return requireIdToken(req, res).then(decodedToken => {
      const {
        uid,
      } = decodedToken;

      console.log(uid, label, dest, JSON.stringify(destDetails));

      return res.status(200).send({
        data: {
        },
      });
    });
  });
  

  // Listen
  app.listen(8080, () => {
    console.log('REST API server started');
  });
};
  
