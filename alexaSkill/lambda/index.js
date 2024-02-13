/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
const axios = require('axios'); 
const fs = require('fs');
const Util = require('./util.js');
const isREST = require('./intersight-rest.js');

//process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
var DEBUG = true; // flip to activate debug logging 



const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = '<amazon:emotion name="excited" intensity="medium">Greeting Stefano, and welcome to Intersight Helper</amazon:emotion>, you can say deploy a new VM or provision a new windows host. Which would you like to try?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const DeployVMIntent = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DeployVMIntent';
    },
    handle(handlerInput) {
        const vmType  = handlerInput.requestEnvelope.request.intent.slots.vmType.resolutions.resolutionsPerAuthority[0].values[0].value.id;
        console.log("Requested VM is " + vmType);
        const resourcePath = '/workflow/WorkflowInfos';
        var speakOutput = "Well done, ";
        var postBody = {
            Name: "07 Create New Ubuntu VM",
            Action: "Start",
            AssociatedObject: {
                ObjectType: "organization.Organization",
				/* The MoID of the Intersight Organization */
                Moid:"64485f7a69726531053e1126"
            },
            Input: {
                Name: "AlexaWithLove"
            },
            WorkflowDefinition: {
				/* The MoID of the Intersight Workflow you want to run. Get it from intersight */
                Moid:"65a94f8a696f6e310564549d",
                ObjectType:"workflow.WorkflowDefinition"
            },
            WorkflowCtx: {
                InitiatorCtx:{
                    InitiatorMoid:"64773eb8696f6e310128107f",
                    InitiatorName:"Alexa Skill",
                    InitiatorType:"workflow.WorkflowDefinition"
                }
            }
        };
        
        /* Set POST Options */
        var options = {
            httpMethod: 'post',
            uri: 'https://eu-central-1.intersight.com/',
            resourcePath: '/workflow/WorkflowInfos',
            body: postBody
        };
        
        isREST.intersightREST(options).then(response => {
            console.log(response.body);
             speakOutput += " your virtual machine is deploying";

        }).catch(err => {
            console.log('-----> Error: ', err);
            speakOutput += "<amazon:emotion name='disappointed' intensity='medium'> sorry but there was an error with your request</amazon:emotion>";

        });
        
        console.log("Returning response")
       speakOutput += " your virtual machine is deploying";
        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};


const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        // Select Resource Path from https://www.intersight.com/apidocs
        const resourcePath = '/ntp/Policies';
        var queryParams = { "$top": 1 };
              var isRequest = {
                method: 'GET',
                uri: 'https://intersight.com/',
                resourcePath: '/api/v1/ntp/Policies'
            }
       
        /* Set GET Options */
        var options = {
                httpMethod: 'get',
                resourcePath: resourcePath,
                queryParams: queryParams
            };
            
        /* Send GET Request */
        var intersightResponse;
        isREST.intersightREST(options).then(response => {
            intersightResponse = JSON.parse(response.body).Results[0].Name;
            console.log("intersightResponse is " + intersightResponse);
        }).catch(err => {
            console.log('Error: ', err);
        });
        const speakOutput = `Ok, here is what I got from Intersight: ${intersightResponse}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = '<amazon:emotion name="disappointed" intensity="medium">Sorry, I had trouble doing what you asked.</amazon:emotion> Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// --[ SECTION 3 Custom Functions ----------------------------------------------------------------------

const makeGetRequest = async (pURL, pUserName, pPassword) => {
  DEBUG && console.log("pURL:" + pURL)
  try {
    var options = {
            auth: {
                username: pUserName,
                password: pPassword
            }
        }
    const { data } = await axios.get('https://' + pURL, options);
    console.log("Data received: " + JSON.stringify(data, null, 2) )
    return data;
  } catch (error) {
    console.error('cannot fetch data', error);
  }
};




isREST.setPublicKey("ADD_YOUR_INTERSIGHT_API_KEY_HERE");
/* Add your RSA Private Key Here
 * MAke sure to include also the opening 
 * and closing header */
isREST.setPrivateKey(`ADD YOUR RSA PRIVATE KEY HERE`);


/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelloWorldIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        DeployVMIntent,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .lambda();