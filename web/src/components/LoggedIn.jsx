import React, { useState, useEffect } from "react";
import { withAuth0 } from "@auth0/auth0-react"; 
import { FiThumbsUp, FiThumbsDown } from "react-icons/fi";

const LoggedIn = ({ auth0 }) => {  // Receive auth0 prop
  const [products, setProducts] = useState([]);
  const [voted, setVoted] = useState({
    "world-of-authcraft": "",
    "ocean-explorer": "",
    "dinosaur-park": "",
    "cars-vr": "",
    "robin-hood": "",
    "real-world-vr": "",
  });

  const { getAccessTokenSilently, isLoading, user, logout, isAuthenticated } = auth0;

  useEffect(() => {
    const getProducts = async () => {
      try {
        const token = await getAccessTokenSilently();
        const response = await fetch("http://localhost:8080/products", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const responseData = await response.json();
        setProducts(responseData);
      } catch (error) {
        console.error(error);
      }
    };

    getProducts();
  }, [getAccessTokenSilently]); 

  const vote = async (slug, type, index) => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(
        `http://localhost:8080/products/${slug}/feedback`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ vote: type }),
        }
      );

      if (response.ok) {
        setVoted({
          ...voted,
          [slug]: type, 
        });
      } else {
        console.log(response.status);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <div className="jumbotron text-center mt-5">
        {isAuthenticated && (
          <span className="btn btn-primary float-right" onClick={() => logout()}>
            Log out
          </span>
        )}
        <h1>We R VR</h1>
        <p>
          Hi, {user.name}! Below you'll find the latest games that need feedback. Please provide honest feedback so developers can make the best games.
        </p>
        <div className="row">
          {products.map((product, index) => {
            const prodSlug = product.Slug;
            return (
              <div className="col-sm-4" key={index}>
                <div className="card mb-4">
                  <div className="card-header">{product.Name}</div>
                  <div className="card-body">{product.Description}</div>
                  <div className="card-footer">
                    <a onClick={() => vote(prodSlug, "Upvoted", index)} className="btn btn-default float-left">
                      <FiThumbsUp />
                    </a>
                    <small className="text-muted">{voted[prodSlug]}</small>
                    <a onClick={() => vote(prodSlug, "Downvoted", index)} className="btn btn-default float-right">
                      <FiThumbsDown />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default withAuth0(LoggedIn); 
