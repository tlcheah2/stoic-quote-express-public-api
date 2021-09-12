# Stoicism Quote API Documentation

This repository is rebuilt using different tech-stack for learning and experimental purposes. The [original repo](https://github.com/tlcheah2/stoic-quote-lambda-public-api) was mainly built with AWS Serverless Framework. 

However, I intend to explore the ECR, ECS and other DevOps practice with this simple Express App.

## Introduction
This API generates stoicism quotes to help you live a better life using Stoicism wisdom.

## Overview
At this moment, this GET API returns data in the body as a JSON with the `author` and `quote`.

## Usage
GET https://api.themotivate365.com/stoic-quote

The request takes no parameters, headers or query strings.

## Example
`curl -X GET https://api.themotivate365.com/stoic-quote`

Generates:
```
{
  "data": {
    "author":"Ryan Holiday",
    "quote":"True will is quiet humility, resilience, and flexibility; the other kind of will is weakness disguised by bluster and ambition."
  }
}
```

## Tech Stack used for this project
- ExpressJS
- MongoDB Atlas
- Docker
- ECR - Where we build docker images & save in AWS
- ECS - Where we run docker containerized app
- CI/CD using [Buddy](buddy.works)
