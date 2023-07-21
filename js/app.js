
const RADIX = 256;
const PRIME = 908209935089; 
const ROOT_PRIME = 95300;
duplicateWords = 0;
var START_TIME;
// const dictionary_database = 'https://raw.githubusercontent.com/farhanfuad35/lumos/main/data/E2Bdatabase.json';
const dictionary_database = '../data/E2Bdatabase.json';
class Dictionary{
    database
    numberOfWords
};

class Hashing{
    hashTable;
    hashTableKeys;
    primaryHashA = null;
    primaryHashB = null;

    initializeHashTable(){
        this.hashTable = new Array(dictionary.numberOfWords);
        for(var i=0; i<dictionary.numberOfWords; i++){
            this.hashTable[i] = [];
        }
        this.hashTableKeys = new Array(dictionary.numberOfWords).fill(null);
    }


    convertFromWordToKey(word){
        // word is a lower case word from frontend 
        var val = 0;
        var a = Math.floor(Math.random() * (PRIME - 1) ) + 1;
        var b = Math.floor(Math.random() * PRIME);

       
        if(this.primaryHashA == null || this.primaryHashB == null){
            this.primaryHashA = a;
            this.primaryHashB = b;
        }
        else{
            a = this.primaryHashA;
            b = this.primaryHashB;
        }

        for(var i=0; i<word.length; i++){
            val = ( (val*RADIX) % PRIME + word.charCodeAt(i) ) % PRIME;
        }

        // BigInt used to handle large values

        const aBig = BigInt(a);
        const valBig = BigInt(val);
        const primeBig = BigInt(PRIME);
        const bBig = BigInt(b);
        const key = (aBig*valBig + bBig) % primeBig;

        return Number(key);
    }

    secondaryHashFunction(a, b, m, word){
        const aBig = BigInt(a);
        const keyBig = BigInt(this.convertFromWordToKey(word));

        return ( ( Number((aBig*keyBig)%BigInt(PRIME)) + b ) % PRIME ) % m;
    }

    isCollissionDetected(a, b, m, initialArray, finalArray){
        for(var i=0; i<initialArray.length; i++){
            var secondaryHashValue = this.secondaryHashFunction(a, b, m, dictionary.database[initialArray[i]].en);

            if(finalArray[secondaryHashValue]==null){
                finalArray[secondaryHashValue] = initialArray[i];
            }
            else{
                return true;
            }
        }
        return false;
    }

    generateSecondaryHash(returnArray, primaryHashValue){
        // returnArray is the hashtable for secondary hash

        var finalArrayLength = returnArray.length*returnArray.length;
        var finalArray = new Array(finalArrayLength).fill(null);
        //making a copy of return array to avoid any occurrence
        var initialArray = Array.from(returnArray);

        // Try Random a, b and see if collision occurs
        var a = Math.floor(Math.random() * (PRIME - 1) ) + 1;
        var b = Math.floor(Math.random() * PRIME);
        // error handling
        var itr = 0;

        while(this.isCollissionDetected(a, b, finalArrayLength, initialArray, finalArray)){
            
            itr = itr+1;
            if(itr>99) {
                console.log('a = ' + a + ", b = " + b);
                console.log('Final Length: ' + finalArrayLength);
                console.log('The array: ');
                for(var i = 0; i<returnArray.length; i++){
                    console.log(dictionary.database[returnArray[i]].en)
                    console.log('Word Index: ' + returnArray[i] );
                    console.log("Key: " + this.convertFromWordToKey(dictionary.database[returnArray[i]].en));
                    console.log('Secondary Hashing: ' + this.secondaryHashFunction(a, b, finalArrayLength, dictionary.database[returnArray[i]].en))
                }
                console.log('\n')
                console.log('Final array: ')
                for(var i=0; i<finalArray.length; i++){
                    console.log(i + ' ' + finalArray[i]);
                }

                throw Error('Too many iterations required!');
            }
            
            
            a = Math.floor(Math.random() * (PRIME - 1) ) + 1;
            b = Math.floor(Math.random() * PRIME);

            // nulls the array when any collision is detected
            // beacause as a matter of fact in perfect hashing 
            // there should be no collision in seconday hash table
            finalArray.fill(null);            
        }

        // Save the values for a, b, and m
        this.hashTableKeys[primaryHashValue] = [a, b, finalArrayLength];

        return finalArray;  

    }
    calculatePrimaryHash(word){
        return this.convertFromWordToKey(word) % dictionary.numberOfWords;
    }
    noDuplicate(word, array){
        var unique = true;
        for(var i=0; i<array.length; i++){
            if(dictionary.database[array[i]].en == word){
                duplicateWords++;
                unique = false;
                break;
            }
        }

        return unique;
    }

    

    generatePrimaryHash(word){       
        return this.convertFromWordToKey(word) % dictionary.numberOfWords;
    }

    generateHashTable(){
        START_TIME = new Date();
        this.initializeHashTable();

        for(var i=0; i<dictionary.numberOfWords; i++){
            dictionary.database[i].en = dictionary.database[i].en.toLowerCase();
            var word = dictionary.database[i].en;
            var primaryKey = this.generatePrimaryHash(word);
            if(this.noDuplicate(word, this.hashTable[primaryKey])){                
                this.hashTable[primaryKey].push(i);
            }
        }        

        // Detect Collisions in primary and apply secondary Hashing
        for(var i=0; i<dictionary.numberOfWords; i++){
            if(this.hashTable[i].length > 1){
                // Number of collision detected in this bucket

                this.hashTable[i] = this.generateSecondaryHash(this.hashTable[i], i);
                
            }
            else if(this.hashTable[i].length == 1){
                this.hashTableKeys[i] = [1, 0, 1];
            }
        }


        
    }
}


// Variables

var dictionary = new Dictionary();
var hashing = new Hashing();

window.onload = function initializeHashing(){
    console.log('Data Received');
    dictionary = fetch(dictionary_database)
        .then(response => {
            if(!response.ok){
                throw new Error("HTTP error " + response.status);
            }
            return response.json()
        })
        .then(json => {
            dictionary.database = json;
            dictionary.numberOfWords = Object.keys(dictionary.database).length;
        })
        .then(response => hashing.generateHashTable());
}

function search(){
    var input = document.getElementById('query');
    var word = input.value.toLowerCase();
    var output = document.getElementById('output');
    var pHash = hashing.calculatePrimaryHash(word);
    var sHash;

    try{
        if(hashing.hashTableKeys[pHash] == null){
            throw 'Word Not Found';
        }

        const a = hashing.hashTableKeys[pHash][0];
        const b = hashing.hashTableKeys[pHash][1];
        const m = hashing.hashTableKeys[pHash][2];

        sHash = hashing.secondaryHashFunction(a, b, m, word);
        
        if(hashing.hashTable[pHash][sHash] != null && 
            dictionary.database[hashing.hashTable[pHash][sHash]].en == word){
            output.innerHTML = dictionary.database[hashing.hashTable[pHash][sHash]].bn;
        }
        else{
            throw 'Word Not Found';
        }
    }catch(err){
        console.log(err);
        output.innerHTML = '';
    };
    
}