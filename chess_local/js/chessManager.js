// HOMEWORK INSTRUCTIONS: Build an editable order form for a restauraunt!
// 1. Add the correct config object to the bottom of the index.html file for this folder. You will be using your own firebase database as the backend for this homework.
// 2. Build an editable order form for a restauraunt
// 3. A user should be able to add a dish to the order with a description
// 4. The user should be able to read all the items in the order out onto the page

// BONUS
// 1. Can you make it so that the user is able to edit each description the items in their order
// 2. Can you make it so that the user is able to delete an item from the order!
// 3. Can you add a price to each order item?
// 4. Can you create a total for all the items in the order?
// 5. Can you allow the user to add an image to their order?
// 6. Can you make it so that if the user tries to update the input with nothing it wont submit and sends the user an error?

$(function() {
	console.log('loaded');
	//Connect to database
	var response = firebase.database();
	var data = response.ref('menu');
	var dataOrders = response.ref('orders');
  var username = '';
	var password = '';
	var dummyImg = 'images/';
	var salesTax = 0.1;


	// jQuery Event Listeners

	// Username: admin, Password: password
	$('#loginBtn').on('click', function(event) {

			if ($('#username').val() === username && $('#password').val() === password) {
				$('#login').attr("hidden",true);
				$('#mainContainer').attr("hidden",false);
			} else {
				alert('Username and password not recognized!');
			}

	});


	//CREATE
	$('#addDish').on('click', function(event) {

		//make an object to push into firebase with all the info filled in
		if ($('#dish').val()) {  // only if the dish name is filled in
		var dish = {
			name: $('#dish').val(),
			desc: $('#description').val(),
			price: parseFloat($('#price').val() || 0),
			image: $('#image').val()
		};
		}

		$('#dish').val('');
		$('#description').val('');
		$('#price').val('');
		$('#image').val('');

		data.push(dish);
	});

	// READ
	// Firebase Event Listener - kinda like an API call
	data.on('value', function(response) {

		// data = response.ref('menu') so calling this menu would make it less confusing
		var menu = response.val();

			// used for the password system
			username = menu.username;
			password = menu.userpw;
			console.log('firebase values changed');

		$('#menu').html('');

		// cycle through all the dishes stored in firebase
		for (key in menu) {


			if (key === 'username' || key === 'userpw') {continue;} // i put the username and password in the menu ref in firebase
			// if statement will skip over that iteration of the loop if the data is 'username' or 'userpw'

			// grab each dish from the menu referenced from firebase (each one being referred to at the moment)
				var dish = menu[key];

				// html to make a card to display the current dish
				var template = `
                <div class="col-md-4">
                    <div class="card bg-light text-dark mb-3">
                        <div class="card-body">
													<img src="${dish.image || dummyImg}" style="width:75%; padding:5px">
                          <p> Dish:  <input id="dish-${key}" value="${dish.name}"> </p>
												  <p> Description: <input id="desc-${key}" value="${dish.desc}"> </p>
												  <p> Price: <input id="price-${key}" value="${parseFloat(dish.price).toFixed(2)}"> </p>
													<p> Image Path: <input id="image-${key}" value="${dish.image}"> </p>
                        </div>
                        <div class="card-footer">
                            <button data-key="${key}" class="btn btn-danger delete float-right"><i class="fa fa-trash"></i></button>
                            <button data-key="${key}" class="btn btn-success edit float-right mr-3"><i class="fa fa-pencil-alt"></i></button>
                        </div>
                    </div>
                </div>
            `;

				// append the html to the menu element
				$('#menu').append(template);

	} // end of for keys in menu

	});

	// second read, for the orders firebase data
	dataOrders.on('value', function(response) {

			var orders = response.val();

			$('#outstandingOrders').html(''); // clear out the html element

			// we want to add to the list id="outstandingOrders"
			// each will have a delete key and a card inside with a list of dishes and prices
			template = `<li class="list-group-item-success outOrders"> Outstanding Orders </li>`;

			for (key in orders) {
					// orders -> key: obj -> date: 'string', order: array of objs (dishes)
					template += `
						<li class="list-group-item outOrders" style="font-size: 150%">

						<div class="row">
						<div class="col-sm-6">
						<p> <i> Date Received: </i> ${orders[key].date} </p>
						<p> <i> Order ID: </i> ${key} </p>
						</div>

						<div class="col-sm-6">
						<ol class="list-group" style="list-style: none">
					`;  // we will close the </li> after adding a sublist of items and prices

					// make a new list for all dishes and prices
					for (dishIndex in orders[key].order) {

						let dish = orders[key].order[dishIndex];

						template += `
							<li class="list-group-item-info outOrders" style="font-size: 80%">
							${dish.obj.name}, x${dish.num}: $${(dish.num*dish.obj.price).toFixed(2)}
							</li>
							`;
					}

					let totalPrice = orders[key].totalPrice;

					template += `
					<li class="list-group-item-secondary outOrders" style="font-size: 90%; padding: 5px">
					<p> Sub-Total: $${parseFloat(totalPrice).toFixed(2)}  <br>
					 Sales Tax: $${parseFloat(totalPrice*salesTax).toFixed(2)} (${(salesTax*100).toFixed()}%) </p> </li>
					 <li class="list-group-item-dark outOrders" style="font-size: 90%; padding: 5px">
					 <p>Total Price: $${parseFloat(totalPrice*(1+salesTax)).toFixed(2)} </p>
					</li>
						</ol>
						Remove Order (permanently delete):
						<button data-key="${key}" class="btn btn-danger delete float-right"><i class="fa fa-trash"></i></button>
						</div>
					</li>`; // close list element for the ORDER not the Dish



			} // end for key in orders

			$('#outstandingOrders').append(template);

	}); // end of dataOrders onValue

	//Update
	$('#menu').on('click', '.edit', function() {

		var key = $(this).data('key');

		if ($(`#desc-${key}`).val()) {  // only if the dish name is filled in
		var dish = {
			name: $(`#dish-${key}`).val(),
			desc: $(`#desc-${key}`).val(),
			price: parseFloat($(`#price-${key}`).val() || 0),
			image: $(`#image-${key}`).val(),
		};
		}

		response.ref('menu/'+key).update(dish);

	});

	//DELETE
	$('#menu').on('click', '.delete', function() {

			var key = $(this).data('key');

			response.ref('menu/'+key).remove();

	});

	//DELETE OUTSTANDING ORDERS
	$('#outstandingOrders').on('click', '.delete', function() {

			var key = $(this).data('key');

			response.ref('orders/'+key).remove();

	});

	//Prevent Form Submission
	$('#formAddDish').on('submit', function(event) {
		event.preventDefault();
	});

	$('#loginForm').on('submit', function(event) {
		event.preventDefault();
	});



});
