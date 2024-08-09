import React, { Fragment } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const Home = () => {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  
  return (
    <Fragment>
      <div className="container">
        <div className="jumbotron text-center mt-5">
          <h1>We R VR</h1>
          <p>Provide valuable feedback to VR experience developers.</p>
          {!isAuthenticated && (
            <button 
              className="btn btn-primary btn-lg btn-login btn-block" 
              //onClick={() => loginWithRedirect({redirectUri: window.location.origin + '/protected'})}
              onClick={() => loginWithRedirect({})}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </Fragment>
  );
};

export default Home;
