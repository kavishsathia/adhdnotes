import json
import os
import uuid
from dotenv import load_dotenv
import psycopg2
import asyncio
from flask import Flask, request, flash, send_file
from flask import request
from flask_cors import CORS
import openai
import threading
from markdown_pdf import MarkdownPdf, Section
import telebot

load_dotenv()

app = Flask(__name__)
CORS(app)

bot = telebot.TeleBot(os.environ["BOT_TOKEN"], parse_mode=None)


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


@app.route('/file/web-clip', methods=['POST'])
def create_web_clip():
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
                            Can you reformat the following text, include all the information.
                            Do not include additional information. Use basic markdown.

                            Text: {data["text"]}

                            You must return a JSON object like this: {{ "markdown": "" }}
                        """
                    }
                ],
                response_format={"type": "json_object"}
            )

            markdown = json.loads(response.choices[0].message.content)[
                "markdown"]

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": f"""
                            Give the following text a succint title.

                            Text: {markdown}

                            You must return a JSON object like this: {{ "title": "" }}
                        """
                    }
                ],
                response_format={"type": "json_object"}
            )

            embedding_response = client.embeddings.create(
                model="text-embedding-ada-002",
                input=markdown
            )

            cursor.execute("""
                SELECT id, name FROM File WHERE markdown IS NULL ORDER BY embedding <-> %s LIMIT 1
            """, (json.dumps(embedding_response.data[0].embedding),))

            parent = cursor.fetchall()

            cursor.execute("""
                INSERT INTO File VALUES (%s, %s, %s, %s, %s) 
            """, (str(uuid.uuid4()), json.loads(response.choices[0].message.content)["title"], markdown, parent[0][0] if len(parent) else None, embedding_response.data[0].embedding))

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


@bot.message_handler(func=lambda x: True, content_types=['photo', 'text'])
def send_welcome(telemessage):
    with get_db() as db:
        with db.cursor() as cursor:
            if telemessage.photo and len(telemessage.photo):
                url = bot.get_file_url(telemessage.photo[-1].file_id)
                content = requests.get(url).content

                client = openai.Client()
                response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Describe this image. Extract all the text out of it. If there is no text, describe the image."},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64.b64encode(content).decode('utf-8')}",
                                    },
                                },
                            ],
                        }
                    ],
                    max_tokens=300,
                )

                text = response.choices[0].message.content

                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "user",
                            "content": f"""
                                Give the following text a succint title.

                                Text: {text}

                                You must return a JSON object like this: {{ "title": "" }}
                            """
                        }
                    ],
                    response_format={"type": "json_object"}
                )

                embedding_response = client.embeddings.create(
                    model="text-embedding-ada-002",
                    input=text
                )

                cursor.execute("""
                    SELECT id, name FROM File WHERE markdown IS NULL ORDER BY embedding <-> %s LIMIT 1
                """, (json.dumps(embedding_response.data[0].embedding),))

                parent = cursor.fetchall()

                cursor.execute("""
                    INSERT INTO File VALUES (%s, %s, %s, %s, %s) 
                """, (str(uuid.uuid4()), json.loads(response.choices[0].message.content)["title"], text, parent[0][0] if len(parent) else None, embedding_response.data[0].embedding))

                return bot.reply_to(telemessage, "Your note was added to " + (parent[0][1] if len(parent) else "Home"))
            else:
                client = openai.Client()
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "user",
                            "content": f"""
                                Give the following text a succint title.

                                Text: {telemessage.text}

                                You must return a JSON object like this: {{ "title": "" }}
                            """
                        }
                    ],
                    response_format={"type": "json_object"}
                )

                embedding_response = client.embeddings.create(
                    model="text-embedding-ada-002",
                    input=telemessage.text
                )

                cursor.execute("""
                    SELECT id, name FROM File WHERE markdown IS NULL ORDER BY embedding <-> %s LIMIT 1
                """, (json.dumps(embedding_response.data[0].embedding),))

                parent = cursor.fetchall()

                cursor.execute("""
                    INSERT INTO File VALUES (%s, %s, %s, %s, %s) 
                """, (str(uuid.uuid4()), json.loads(response.choices[0].message.content)["title"], telemessage.text, parent[0][0] if len(parent) else None, embedding_response.data[0].embedding))

                return bot.reply_to(telemessage, "Your note was added to " + (parent[0][1] if len(parent) else "Home"))


@app.route("/convert-to-pdf", methods=['POST'])
def convert_to_pdf():
    try:
        markdown = request.json['markdown']
        pdf = MarkdownPdf(toc_level=2)
        pdf.add_section(Section(markdown, toc=False))
        pdf.save("result.pdf")
        return send_file('./result.pdf')
    except Exception as e:
        return {"error": str(e)}, 500


if __name__ == '__main__':
    port = os.environ.get("PORT", 8080)
    app.run(host='0.0.0.0', port=port, debug=False)
