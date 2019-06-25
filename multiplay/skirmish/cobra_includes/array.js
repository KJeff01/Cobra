//Here be array prototypes that are used to manipulate arrays or do
//useful operations on them.

// Return a random element from an array.
Array.prototype.randomElement = function()
{
	if (this.length)
     {
		return this[random(this.length)];
     }
};

// Pop multiple elements from an array.
Array.prototype.popMultiple = function(num)
{
	var i = this.length;
	while (i < num)
	{
		if (this.length)
		{
			this.pop();
		}
		else
		{
			break;
		}
	}

	return this;
};

// Return the last element in an array.
Array.prototype.last = function()
{
	if (this.length)
     {
		return this[this.length - 1];
     }
};

// Fisher-Yates shuffle on an array.
Array.prototype.shuffle = function()
{
     var counter = this.length;
     while (counter)
     {
          var index = random(counter);
          --counter;
          var temp = this[counter];
          this[counter] = this[index];
          this[index] = temp;
     }

     return this;
};
