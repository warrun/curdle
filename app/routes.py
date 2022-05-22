import os
from app import app, db
from app.forms import AdminLoginForm, PuzzleUploadForm
from flask import render_template, flash, redirect, request, url_for
from wtforms import ValidationError
from werkzeug.utils import secure_filename
from app.models import Cheese, PuzzleHistory, Type, Country, Animal, Continent, User
from . import puzzlesetter
from datetime import date
from flask_login import current_user, login_user, login_required, logout_user

# Routes are written as shown below
# The decorators at the beginning (starting with @app) define what URL's the code below them is run on
# The view function contains this code

# Set global variables for client and server side puzzle IDs
todays_server_puzzle_id = 0
todays_client_puzzle_id = 0

@app.route('/')
@app.route('/index', methods=['GET', 'POST'])
# A view function for the homepage which displays the game
def index():

    global todays_server_puzzle_id
    global todays_client_puzzle_id
    # Get todays client-side puzzle ID - this increments by one every day
    
    todays_client_puzzle_id = puzzlesetter.get_puzzle_id_for_client()

    # Check database to see if a puzzle has been generated for today
    result = db.session.query(PuzzleHistory).filter(PuzzleHistory.client_puzzle_id == todays_client_puzzle_id).scalar()

    # If no entry has been stored for todays puzzle, add an entry and set a server side puzzle id
    if result is None:
        todays_server_puzzle_id = puzzlesetter.set_puzzle_id_for_server()
        p = PuzzleHistory(client_puzzle_id=todays_client_puzzle_id, server_puzzle_id=todays_server_puzzle_id, puzzle_date=date.today())
        db.session.add(p)
        db.session.commit()
    # Else, use the value stored in the database
    else:
        todays_server_puzzle_id = db.session.query(PuzzleHistory.server_puzzle_id).filter(PuzzleHistory.client_puzzle_id == todays_client_puzzle_id).scalar()
        print(todays_server_puzzle_id)

    print("Todays client puzzle ID is: " + str(todays_client_puzzle_id))
    print("Todays server puzzle ID is: " + str(todays_server_puzzle_id))

    image = db.session.query(Cheese.image_filename).filter(Cheese.id == todays_server_puzzle_id).scalar()

    # Get list of cheeses from the database to be used in the game's guess selector field
    # SQLAlchemy returns this as a list of KeyedTuples for some reason, even though there is only one value stored..
    result = db.session.query(Cheese.cheese_name).all()
    
    # Iterate through results and add all cheese name values to a list
    cheeses = []
    for row in result:
        cheeses.append(row[0])

    # Render the game html template in the browser
    # Image filename and sorted list of cheeses are passed to the template renderer
    return render_template('index.html', cheeses=sorted(cheeses), image=image)

# This route below can receive GET and POST requests, required for receiving form data - Default without this set is just to receive GET requests
@app.route('/login', methods=['GET', 'POST'])
def login():
    # Check if user authernicated already, if so redirect to the admin page
    if current_user.is_authenticated:
        return redirect(url_for('admin'))
    # Create new form object
    form = AdminLoginForm()
    
    # Render the login page, then, if valid form submission, check password and if correct redirect to the admin page

    if form.validate_on_submit():
        
        # Create user object from results returned by searching username
        user = User.query.filter_by(username=form.username.data).first()
        # If user doesnt exist, flash message to user explaining
        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password')
            return redirect(url_for('login'))
        # Create new Flask-Login login session for the user
        login_user(user, remember=form.remember_me.data)
        # Redirect to the admin page
        return redirect(url_for('admin'))

    return render_template('login.html', title='Curdle Administrator Portal', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You can successfully logged out of the Curdle Administrator Console')
    return redirect('/login')

    

@app.route('/admin', methods=['GET', 'POST'])
@login_required
def admin():
    

    # Create new instance of PuzzleUploadForm()
    form = PuzzleUploadForm()

    # Retreive lists of cheese attributes from the database
    form.type.choices = db.session.query(Type.id, Type.type).all()
    form.animal.choices = db.session.query(Animal.id, Animal.animal_name).all() 
    form.country.choices = db.session.query(Animal.id, Country.country_name).all() 

    if form.validate_on_submit():
        # Here goes the code that recieves the data and handles adding it to the database
        if request.method == "POST":

            req = request.form


            f = form.image.data
            filename = secure_filename(f.filename)
            f.save(os.path.join(app.instance_path, 'images', filename))
            
            print(req)

            flash('Puzzle Upload Successful')

            # return redirect(request.url)
    
    return render_template('admin.html', title="Curdle Administrator Console", form=form)
    
@app.route('/check-guess', methods=['GET', 'POST'])
def check_guess():
    
    # Get cheese name from client side
    if request.method == "POST":

        cheese_name = request.get_json() # This returns a single entry dict containing the cheese name

        answer = Cheese.query.filter_by(id=puzzlesetter.get_puzzle_id_for_server()).first()

        guess = Cheese.query.filter_by(cheese_name=cheese_name['cheese_name']).first() #cheese_name

        results = {'name': True, 'country': True, 'mould': True, 'animal': True, 'type': True, 'continent': True}

        # If the answer and guess share the same ID, the game is won (id is unique in the database)
        if (answer.id == guess.id) and (answer.cheese_name != guess.cheese_name):
                
                return results
        
        if (answer.cheese_name != guess.cheese_name):
            results['name'] = False

        if (answer.country_id != guess.country_id):
            results["country"] = False

        if (answer.mouldy != guess.mouldy):
            results["mould"] = False

        if (answer.animal_id != guess.animal_id):
            results["animal"] = False

        if (answer.type_id != guess.type_id):
            results["type"] = False

        guess_country = Country.query.filter_by(id=guess.country_id).first()

        answer_country = Country.query.filter_by(id=answer.country_id).first()

        if (answer_country.continent_id != guess_country.continent_id):
            results["continent"] = False

        print(results)
        return results

@app.route('/get-cheeses', methods=['GET', 'POST'])
def get_cheeses():

    if request.method == "POST":
        
        result = db.session.query(Cheese.id, Cheese.cheese_name).all()
    
        # Iterate through results and add all cheese name values to a list
        cheeses = {}
        for row in result:
            cheeses[row[0]] = row[1]
        print(cheeses)
        return cheeses

# Respond to client request todays puzzle id (the client facing one) and the puzzles date
@app.route('/puzzle-id', methods=['GET', 'POST'])
def puzzle_id():

    if request.method == "POST":
        
        puzzle_data = puzzlesetter.get_daily_puzzle_info()

        print(puzzle_data)
        
        return puzzle_data

# Returns the correct answer - used by client to inform 
@app.route('/get-answer', methods=['GET', 'POST'])
def get_answer():

    if request.method == "POST":

        answer = db.session.query(Cheese.cheese_name, Type.type, Animal.animal_name, Country.country_name, Cheese.mouldy, Continent.continent_name, Cheese.image_attribution, Cheese.info_link)\
            .join(Cheese.cheese_type)\
            .join(Cheese.cheese_animal)\
            .join(Cheese.cheese_country)\
            .join(Country.country_continent)\
            .filter(Cheese.id == todays_server_puzzle_id).first()

        json_answer = {
            'name' : answer[0],
            'type' : answer[1],
            'animal' : answer[2],
            'country' : answer[3],
            'mouldy' : answer[4],
            'continent' : answer[5],
            'image_attribution' : answer[6],
            'info_link' : answer[7]
            }
        
        return(json_answer)
