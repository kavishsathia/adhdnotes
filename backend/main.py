import json
import os
import uuid
from dotenv import load_dotenv
import psycopg2
import asyncio
from flask import Flask, request, flash
from flask import request
from flask_cors import CORS
import openai

load_dotenv()

app = Flask(__name__)
CORS(app)


def get_db(): return psycopg2.connect(user=os.environ['RDS_USER'], password=os.environ['RDS_PASSWORD'],
                                      host=os.environ['RDS_HOST'], port=5432, database=os.environ['RDS_DATABASE'], sslmode="require")


@app.route('/file/<id>', methods=['GET'])
def get_file(id: str):
    with get_db() as db:
        with db.cursor() as cursor:
            cursor.execute("""
                SELECT id, name, markdown, parent_id FROM File WHERE id = %s
            """, (id,))

            result = cursor.fetchone()

            return {
                "id": result[0],
                "name": result[1],
                "markdown": result[2],
                "parentId": result[3]
            }


@app.route('/files', methods=['GET'])
def get_files():
    with get_db() as db:
        with db.cursor() as cursor:

            if request.args.get('parent'):
                cursor.execute("""
                    SELECT id, name, markdown, parent_id FROM File WHERE parent_id = %s
                """, (request.args.get('parent'),))
            else:
                cursor.execute("""
                    SELECT id, name, markdown, parent_id FROM File WHERE parent_id IS NULL
                """)

            result = cursor.fetchall()
            print(result)

            return [{
                "id": item[0],
                "name": item[1],
                "markdown": item[2],
                "parentId": item[3]
            } for item in result]


@app.route('/file', methods=['POST'])
def create_file():
    data = request.json
    with get_db() as db:
        with db.cursor() as cursor:
            client = openai.Client()
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": f"""
                            Give the following text a succint title.

                            Text: {data["markdown"]}

                            You must return a JSON object like this: {{ "title": "" }}
                        """
                    }
                ],
                response_format={"type": "json_object"}
            )

            embedding_response = client.embeddings.create(
                model="text-embedding-ada-002",
                input=data["markdown"]
            )

            cursor.execute("""
                SELECT id, name FROM File WHERE markdown IS NULL ORDER BY embedding <-> %s LIMIT 1
            """, (json.dumps(embedding_response.data[0].embedding),))

            parent = cursor.fetchall()

            cursor.execute("""
                INSERT INTO File VALUES (%s, %s, %s, %s, %s) 
            """, (str(uuid.uuid4()), json.loads(response.choices[0].message.content)["title"], data['markdown'], parent[0][0] if len(parent) else None, embedding_response.data[0].embedding))

            return {
                "success": True,
                "parent": parent[0][1] if len(parent) else "Home"
            }


@app.route('/file/<id>', methods=['PUT'])
def edit_file(id: str):
    data = request.json
    with get_db() as db:
        with db.cursor() as cursor:
            client = openai.Client()
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": f"""
                            Give the following text a succint title.

                            Text: {data["markdown"]}

                            You must return a JSON object like this: {{ "title": "" }}
                        """
                    }
                ],
                response_format={"type": "json_object"}
            )

            cursor.execute("""
                UPDATE File SET name=%s, markdown=%s WHERE id=%s
            """, (json.loads(response.choices[0].message.content)["title"], data['markdown'], id))

            return {
                "success": True
            }


@app.route('/folder', methods=['POST'])
def create_folder():
    data = request.json
    with get_db() as db:
        with db.cursor() as cursor:
            client = openai.Client()
            response = client.embeddings.create(
                model="text-embedding-ada-002",
                input=data["name"]
            )
            cursor.execute("""
                INSERT INTO File VALUES (%s, %s, %s, %s, %s) 
            """, (str(uuid.uuid4()), data["name"], None, data["parentId"], response.data[0].embedding))

            return {
                "success": True
            }


if __name__ == '__main__':
    port = os.environ.get("PORT", 8080)
    app.run(host='0.0.0.0', port=port, debug=False)
