require('dotenv').config()
const path = require('path')

// Require Provider 
const lti = require('ltijs').Provider
const Database = require('ltijs-sequelize')
const routes = require('./src/routes')
// Setup ltijs-sequelize using the same arguments as Sequelize's generic contructor
const db = new Database('pfel', 'pfel_owner', 'k7oePX5JCmuQ', 
  { 
    host: 'ep-fancy-bar-a7i3x4oe.ap-southeast-2.aws.neon.tech',
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,              // Enforce SSL connection
        rejectUnauthorized: false   // Disable strict SSL certificate validation
      }
    }
  }
);
// Setup provider
lti.setup(process.env.LTI_KEY, // Key used to sign cookies and tokens
  { 
    plugin: db // Passing db object to plugin field
  },
  { // Options
    appRoute: '/', loginRoute: '/login', // Optionally, specify some of the reserved routes
    cookies: {
      secure: false, // Set secure to true if the testing platform is in a different domain and https is being used
      sameSite: 'None' // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
    },
    devMode: true // Set DevMode to true if the testing platform is in a different domain and https is not being used
  }
)

// Set LTI launch callback
lti.onConnect(async (token, req, res) => {
  console.log("Connected");

  // Extract query parameters from the original request
  const query = req.query;

  // Construct the new URL with query parameters
  const queryString = new URLSearchParams(query).toString();
  const newUrl = `http://localhost:3050${
    queryString ? `?${queryString}` : ""
  }`;

  // Redirect to the new URL
  res.redirect(newUrl);

  // return res.sendFile(path.join(__dirname, "./public/index.html"));
});


// also use custom routes
lti.app.use(routes)

const setup = async () => {
  // Deploy server and open connection to the database
  await lti.deploy({ port: 3000 }) // Specifying port. Defaults to 3000

  const basePlatformUrl = 'https://pathwayforexceptionallearners.moodlecloud.com'; // Base URL

  // Register platform
  await lti.registerPlatform({
    url: `https://pathwayforexceptionallearners.moodlecloud.com`, // Base URL
    name: 'PathwayForExceptionalLearners2', // Platform Name
    clientId: 'KEc3AxBT8oSb4To', // Client ID
    authenticationEndpoint: `${basePlatformUrl}/mod/lti/auth.php`, // Full auth endpoint
    accesstokenEndpoint: `${basePlatformUrl}/mod/lti/token.php`, // Full access token endpoint
    authConfig: { 
      method: 'JWK_SET', 
      key: `https://pathwayforexceptionallearners.moodlecloud.com/mod/lti/certs.php` // Full keyset endpoint
    }
  });
}

setup()