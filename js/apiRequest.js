fetch('http://localhost:3000/tomtom/your/resource/url', {
  method: 'GET', // or POST, etc.
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY' // Or any other API-specific authorization.
  }
})
.then(response => {
    if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
    }
    return response.json();
})
.then(data => {
    console.log(data);
})
.catch(error => {
    console.error('There was a problem with the fetch operation:', error);
});
