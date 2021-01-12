FROM python:3.9

COPY requirements.txt /tmp/

RUN pip install -r /tmp/requirements.txt

COPY compressor.py .

CMD [ "python", "./compressor.py" ]